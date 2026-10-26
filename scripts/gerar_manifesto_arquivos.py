"""Gera um índice navegável dos caminhos atualmente rastreados no Git.

Não usa --others: arquivos locais não versionados podem conter dados privados.
"""

from collections import defaultdict
from datetime import date
from pathlib import Path
from urllib.parse import quote
import subprocess

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "docs/historia/MANIFESTO_ARQUIVOS_VERSIONADOS.md"


def category(path: str) -> str:
    parts = path.split("/")
    if len(parts) == 1:
        return "(raiz)"
    if parts[0] in {"docs", "Sprint", "src", "src-tauri", "scripts", "hardware", "firmware", "prototipos", "baropress-liquid-glass"}:
        if parts[0] in {"scripts", "hardware", "baropress-liquid-glass"}:
            return parts[0]
        return "/".join(parts[:2])
    return parts[0]


def main() -> None:
    completed = subprocess.run(
        ["git", "ls-files", "-z"], cwd=ROOT, check=True, stdout=subprocess.PIPE
    )
    paths = {p.decode("utf-8") for p in completed.stdout.split(b"\x00") if p}
    # A página de saída pode ainda não estar no índice na primeira geração.
    paths.add(OUTPUT.relative_to(ROOT).as_posix())
    sections: dict[str, list[str]] = defaultdict(list)
    for path in sorted(paths, key=str.casefold):
        sections[category(path)].append(path)

    lines = [
        "# Manifesto navegável de arquivos versionados — BAROPRESS",
        "",
        f"> Gerado em {date.today().strftime('%d/%m/%Y')} por `python scripts/gerar_manifesto_arquivos.py`.",
        "> Fonte: caminhos rastreados no **índice Git** (`git ls-files`), mais este manifesto.",
        "> Não enumera arquivos locais não rastreados, arquivos externos, dependências ignoradas nem dados privados.",
        "> Para entender funções e origens, comece pelo [mapa completo](../MAPEAMENTO_COMPLETO_PROJETO.md).",
        "",
        f"**Total de caminhos:** {len(paths)} · **Grupos:** {len(sections)}.",
        "",
        "## Grupos",
        "",
        "| Área | Quantidade |",
        "| --- | ---: |",
    ]
    for area, members in sorted(sections.items(), key=lambda item: item[0].casefold()):
        lines.append(f"| `{area}` | {len(members)} |")
    lines += ["", "## Índice completo", ""]
    for area, members in sorted(sections.items(), key=lambda item: item[0].casefold()):
        lines.append(f"### `{area}` ({len(members)})")
        lines.append("")
        for path in members:
            target = quote("../../" + path, safe="/-_.~")
            # JSON/MD can contain '[' or ']' in a path, so use the path as code in link text.
            label = path.replace("`", "\\`").replace("[", "\\[").replace("]", "\\]")
            lines.append(f"- [`{label}`]({target})")
        lines.append("")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Gerado {OUTPUT}: {len(paths)} caminhos, {len(sections)} grupos.")


if __name__ == "__main__":
    main()
