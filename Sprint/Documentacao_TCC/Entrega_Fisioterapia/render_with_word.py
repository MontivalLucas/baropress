from pathlib import Path
import importlib.util
import subprocess
import sys

SKILL = Path(r'C:\Users\Montival Nunes\.codex\plugins\cache\openai-primary-runtime\documents\26.1007.11041\skills\documents')
spec=importlib.util.spec_from_file_location('canonical_renderer',SKILL/'render_docx.py')
renderer=importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)

def word_pdf(doc_path,user_profile,convert_tmp_dir,stem,verbose):
    pdf=Path(convert_tmp_dir)/f'{stem}.pdf'
    script=Path(__file__).with_name('word_export.ps1')
    proc=subprocess.run(['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(script),str(Path(doc_path).resolve()),str(pdf)],capture_output=True,text=True,timeout=150)
    log=proc.stdout+'\n'+proc.stderr
    return (str(pdf) if pdf.exists() and pdf.stat().st_size else '',log)

# Native Word replaces only conversion because LibreOffice is absent on this host.
# The packaged renderer still calculates page DPI and creates all QA PNGs.
renderer.convert_to_pdf=word_pdf
renderer.main()
