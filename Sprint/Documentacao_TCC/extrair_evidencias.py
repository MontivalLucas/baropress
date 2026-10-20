"""Extrai apenas evidencias tecnicas de calibracao, sem alterar o banco original.

Execute com Python 3. O banco precisa permanecer estavel durante a copia.
Os arquivos de saida sao evidencias de documentacao, nao um backup importavel.
Nao exporta pacientes, usuarios, participantes identificados ou prontuarios.
"""
import collections
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import sqlite3
import statistics
import tempfile

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "Evidencias"
DB = Path(os.environ["APPDATA"]) / "br.com.baropress.app" / "baropress.db"
G = 9.80665


def fingerprint(paths):
    return [{"file": p.name, "bytes": p.stat().st_size,
             "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
            for p in paths if p.exists()]


def dump(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False,
                                      indent=None if name == "DADOS_BRUTOS_CALIBRACAO.json" else 2), encoding="utf-8")


def curve(knots, x):
    if not knots or x < knots[0]["x"] or x > knots[-1]["x"]:
        return None
    for a, b in zip(knots, knots[1:]):
        if b["x"] <= a["x"] or b["y"] < a["y"]:
            raise ValueError("Curva inconsistente")
        if x <= b["x"]:
            return a["y"] + (b["y"] - a["y"]) * (x - a["x"]) / (b["x"] - a["x"])
    return None


def fmt(v):
    if v is None:
        return "NA"
    return f"{v:.6f}" if isinstance(v, float) else str(v)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    paths = [DB, Path(str(DB) + "-wal")]
    before = fingerprint(paths)
    with tempfile.TemporaryDirectory(prefix=".documentacao-snapshot-", dir=ROOT) as td:
        assert Path(td).resolve().is_relative_to(ROOT.resolve())
        for p in paths:
            if p.exists():
                shutil.copyfile(p, Path(td) / p.name)
        if before != fingerprint(paths):
            raise RuntimeError("Banco alterado durante copia. Repita com coleta encerrada.")
        c = sqlite3.connect((Path(td) / DB.name).as_uri() + "?mode=ro", uri=True)
        c.execute("PRAGMA query_only=ON")
        if c.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise RuntimeError("Snapshot inconsistente")
        schema = c.execute("PRAGMA user_version").fetchone()[0]
        mats = [json.loads(r[0]) for r in c.execute("SELECT spec_json FROM calibration_mats")]
        profiles = [json.loads(r[0]) for r in c.execute("SELECT profile_json FROM calibration_profiles")]
        validations = [json.loads(r[0]) for r in c.execute("SELECT result_json FROM calibration_validations")]
        active = list(c.execute("SELECT mat_id,profile_id FROM calibration_active"))
        trials = []
        for r in c.execute("SELECT id,mat_id,source,state,spec_json,summary_json,reason,created_at FROM calibration_trials ORDER BY created_at"):
            spec = json.loads(r[4])
            spec.pop("participantCode", None)
            history = spec.get("classificationCorrection")
            if history:
                history.pop("operatorId", None)
            frames = []
            for expected, row in enumerate(c.execute("SELECT ordinal,frame_count,frames_json FROM calibration_frame_chunks WHERE trial_id=? ORDER BY ordinal", (r[0],))):
                chunk = json.loads(row[2])
                if expected != row[0] or row[1] != len(chunk):
                    raise ValueError("Ordem/quantidade de lotes inconsistente")
                frames.extend(chunk)
            for f in frames:
                if len(f["values"]) != 225 or any(type(v) is not int or not 0 <= v <= 4095 for v in f["values"]):
                    raise ValueError("Quadro bruto invalido")
            trials.append({"id": r[0], "matId": r[1], "source": r[2], "state": r[3],
                           "spec": spec, "summary": json.loads(r[5]) if r[5] else None,
                           "reason": r[6], "createdAt": r[7], "frames": frames})
        exam_counts = dict(c.execute("SELECT source,COUNT(*) FROM exams GROUP BY source"))
        exam_columns = ["type","source","status","duration","acquisition_frequency","frame_count","threshold","vmax","gamma","smoothing","tare_applied","max_pressure","mean_pressure","contact_area_percent","contact_sensors","cop_x","cop_y","left_load","right_load","left_percent","right_percent","matrix_json"]
        exams = []
        for i,r in enumerate(c.execute("SELECT "+",".join(exam_columns)+" FROM exams ORDER BY id"),1):
            e = dict(zip(exam_columns,r))
            e["studyLabel"] = f"E{i:02d}"
            e["matrixADCProcessed"] = json.loads(e.pop("matrix_json")) if e["matrix_json"] else None
            exams.append(e)
        raw_exam_count = c.execute("SELECT COUNT(*) FROM exam_frames").fetchone()[0] + c.execute("SELECT COUNT(*) FROM exam_raw_chunks").fetchone()[0]
        c.close()
    captured = dt.datetime.now(dt.timezone.utc).isoformat()
    provenance = {"extractedAtUtc": captured, "timezoneForDisplay": "America/Sao_Paulo",
                  "databaseSchema": schema, "sourceFiles": before, "method": "stable DB+WAL copy; SQLite read-only; quick_check ok",
                  "privacy": "Only calibration tables; no patient/user records; participant identifiers omitted",
                  "originalDatabaseModified": False}
    dump("DADOS_BRUTOS_CALIBRACAO.json", {"provenance": provenance, "mats": mats, "trials": trials})
    dump("PERFIL_E_VALIDACAO_REGISTRADOS.json", {"profiles": profiles, "validations": validations, "activeSelections": active})
    dump("EXAMES_ADC_SEM_IDENTIFICADORES.json", {"notice":"Processed exam matrices, not raw frames. No patient/user identifiers. No documented association to calibration trial conditions.", "rawExamRecordsFound": raw_exam_count, "exams":exams})

    rows = []
    sensor_lines = ["MEDIAS E DISPERSAO POR SENSOR — ADC BRUTO, SEM TARA OU GAMMA",
                    "Media por quadro na janela apos acomodacao. DP amostral (n-1).",
                    "Indice bruto 0..224; linha/coluna 1..15, antes do espelhamento horizontal.",
                    "trial_id|estado|sensor_indice_bruto|linha|coluna|media_ADC|DP_ADC|min_ADC|max_ADC"]
    summary_divergences = []
    for number, t in enumerate(trials, 1):
        s = t["spec"]
        lo, hi = s["settleSeconds"] * 1000, (s["settleSeconds"] + s["durationSeconds"]) * 1000
        window = [f for f in t["frames"] if lo <= f["receivedMs"] <= hi]
        n = len(window)
        if not n:
            raise ValueError("Janela sem dados")
        means = [statistics.mean(f["values"][i] for f in window) for i in range(225)]
        sd = [statistics.stdev(f["values"][i] for f in window) if n > 1 else 0 for i in range(225)]
        stored = t["summary"]
        if stored and (stored["count"] != n or any(abs(a-b) > 1e-7 for a,b in zip(means,stored["means"]))):
            summary_divergences.append(t["id"])
        for i in range(225):
            vals = [f["values"][i] for f in window]
            sensor_lines.append("|".join(map(fmt, [t["id"],t["state"],i,i//15+1,i%15+1,means[i],sd[i],min(vals),max(vals)])))
        mass = s["inputValue"] / 1000 if s["inputUnit"] == "g" else s["inputValue"] if s["inputUnit"] == "kg" else None
        total_mass = mass + s["applicatorKg"] if mass is not None else None
        signal = None
        p = next((p for p in profiles if p["matId"] == t["matId"] and p["scope"] == "TOTAL_FORCE_ONLY"), None)
        preds, invalid = [], 0
        if p:
            signals = [sum(max(0, v-p["baseline"][i]-p["noise"][i]) for i,v in enumerate(f["values"])) for f in window]
            signal = statistics.mean(signals)
            for f,x in zip(window,signals):
                v = None if any(v >= 4090 or v-p["baseline"][i] < -p["noise"][i] for i,v in enumerate(f["values"])) else curve(p["curves"][0],x)
                if v is None:
                    invalid += 1
                else:
                    preds.append(v)
        force = statistics.mean(preds) if preds and invalid == 0 else None
        seconds = (window[-1]["receivedMs"]-window[0]["receivedMs"])/1000
        rows.append({"number": number,"trialId":t["id"],"group":s["group"],"kind":s["kind"],"purpose":s["purpose"],
                     "state":t["state"],"source":t["source"],"repetition":s["repetition"],"position":s["position"],
                     "inputValue":s["inputValue"],"inputUnit":s["inputUnit"],"applicatorKg":s["applicatorKg"],
                     "totalMassKgAsEntered":total_mass,"referenceNAsEntered":total_mass*G if total_mass is not None else None,
                     "allFrames":len(t["frames"]),"windowFrames":n,"measuredWindowSeconds":seconds,"fps":(n-1)/seconds if seconds>0 else None,
                     "meanRawSumADC":sum(means),"meanCorrectedSumADC":signal,
                     "forceNRecomputedWithCandidateProfile":force,"invalidPhysicalFrames":invalid,
                     "saturatedSensorSamples":sum(v>=4090 for f in window for v in f["values"]),
                     "maximumRawADC":max(v for f in window for v in f["values"]),"reason":t["reason"]})
    groups = []
    grouped = collections.defaultdict(list)
    for r in rows:
        if r["state"] == "ACCEPTED" and r["kind"] != "BASELINE":
            grouped[(r["group"],r["purpose"],r["totalMassKgAsEntered"])].append(r)
    for (group,purpose,mass), rs in grouped.items():
        vals = [r["meanCorrectedSumADC"] for r in rs]
        groups.append({"group":group,"purpose":purpose,"totalMassKgAsEntered":mass,"nRepetitions":len(rs),
                       "repetitionNumbers":[r["repetition"] for r in rs],"signalMeanADC":statistics.mean(vals),
                       "signalSDbetweenRepetitionsADC":statistics.stdev(vals) if len(vals)>1 else None,
                       "signalRangeADC":max(vals)-min(vals),"signalCVpercent":100*statistics.stdev(vals)/statistics.mean(vals) if len(vals)>1 and statistics.mean(vals) else None})
    metadata = {"provenance":provenance,"counts":{"trials":len(trials),"states":dict(collections.Counter(t["state"] for t in trials)),
                "sources":dict(collections.Counter(t["source"] for t in trials)),"allFrames":sum(r["allFrames"] for r in rows),
                "windowFrames":sum(r["windowFrames"] for r in rows),"examCountsBySourceOnly":exam_counts},
                "summaryDivergences":summary_divergences,"rows":rows,"groups":groups,"mats":mats,"validations":validations,
                "profiles": [{k:p.get(k) for k in ("id","name","scope","source","state","fitTrialIds","maxError","minValidationTrials","minFitLevels","algorithm")} for p in profiles],
                "activeSelections":active,"additionalExams":exams,"rawExamRecordsFound":raw_exam_count}
    dump("RESUMO_ANALITICO.json",metadata)
    (OUT/"MEDIAS_POR_SENSOR.txt").write_text("\n".join(sensor_lines)+"\n",encoding="utf-8")
    headings = ["number","trialId","group","purpose","state","repetition","inputValue","inputUnit","applicatorKg","totalMassKgAsEntered","windowFrames","measuredWindowSeconds","fps","meanRawSumADC","meanCorrectedSumADC","forceNRecomputedWithCandidateProfile","invalidPhysicalFrames","reason"]
    repeat_lines = ["RESULTADOS POR REPETICAO — EXTRACAO DO BANCO REAL",
                    "Referencia e unidade preservadas como cadastradas; REJECTED nao e referencia valida.",
                    "Sinal corrigido = media por quadro de soma(max(0,ADC-baseline-ruido)).",
                    "Forca recalculada usa perfil candidato TOTAL_FORCE_ONLY, nao ativo nem aprovado.",
                    "NA = indisponivel; nenhum quadro invalido foi preenchido ou extrapolado.","|".join(headings)]
    repeat_lines += ["|".join(fmt(r[k]).replace("\n"," ").replace("|","/") for k in headings) for r in rows]
    (OUT/"RESULTADOS_POR_REPETICAO.txt").write_text("\n".join(repeat_lines)+"\n",encoding="utf-8")
    manifest = {"provenance":provenance,"files":[{"file":f.name,"bytes":f.stat().st_size,"sha256":hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(OUT.iterdir()) if f.is_file() and f.name!="MANIFESTO.json"]}
    dump("MANIFESTO.json",manifest)
    print(json.dumps({"counts":metadata["counts"],"summaryDivergences":summary_divergences,"groups":groups,"validations":validations,
                      "matGeometry": [{k:m.get(k) for k in ("identity","widthMm","heightMm","pitchXMm","pitchYMm","stripWidthMm","capacityKg")} for m in mats],
                      "rowsCompact": [{k:r[k] for k in ("number","group","repetition","state","meanCorrectedSumADC","forceNRecomputedWithCandidateProfile","invalidPhysicalFrames")} for r in rows]},ensure_ascii=False,indent=2))


if __name__ == "__main__":
    main()
