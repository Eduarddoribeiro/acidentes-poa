"""Pipeline de ingestão da base de acidentes (M1).

Uso, a partir da pasta backend:

    python -m app.ingestao --baixar          # baixa a base mais recente e carrega
    python -m app.ingestao caminho/arquivo.csv

Gera um relatório de carga em data/processed/ com aceitos e descartados por motivo.
"""

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

import httpx
import pandas as pd

from app import banco, limpeza
from app.config import CAMINHO_BANCO, PASTA_BACKUP, PASTA_PROCESSED, PASTA_RAW, URL_BASE


def baixar(destino: Path, url: str = URL_BASE) -> Path:
    """Baixa a base da Prefeitura. O servidor é lento, então o tempo limite é longo."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    temporario = destino.with_suffix(".parcial")
    with httpx.stream("GET", url, timeout=httpx.Timeout(60, read=600), follow_redirects=True) as resposta:
        resposta.raise_for_status()
        with temporario.open("wb") as arquivo:
            for bloco in resposta.iter_bytes():
                arquivo.write(bloco)
    temporario.replace(destino)
    return destino


def ler_csv(caminho: Path) -> pd.DataFrame:
    """Lê o CSV da Prefeitura (separador ';'). Tenta UTF-8 e, se falhar, Latin-1."""
    for codificacao in ("utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(caminho, sep=";", dtype=str, encoding=codificacao, keep_default_na=False)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Não foi possível ler {caminho}")


def _data_extracao(bruto: pd.DataFrame) -> str | None:
    if "data_extracao" not in bruto.columns:
        return None
    datas = pd.to_datetime(bruto["data_extracao"], errors="coerce").dropna()
    return datas.max().strftime("%Y-%m-%d") if not datas.empty else None


def fazer_backup(caminho_banco: Path) -> Path | None:
    """Copia o banco atual antes de uma nova carga (seção 11 do escopo)."""
    if not caminho_banco.exists():
        return None
    PASTA_BACKUP.mkdir(parents=True, exist_ok=True)
    destino = PASTA_BACKUP / f"{caminho_banco.stem}_{datetime.now():%Y%m%d_%H%M%S}.db"
    shutil.copy2(caminho_banco, destino)
    return destino


def carregar(arquivo: Path, caminho_banco: Path = CAMINHO_BANCO, pasta_relatorio: Path = PASTA_PROCESSED) -> dict:
    """Lê, valida, limpa e grava a base. Devolve o relatório de carga."""
    bruto = ler_csv(arquivo)
    limpeza.validar_colunas(bruto)
    _, pessoais = limpeza.remover_dados_pessoais(bruto)
    limpo = limpeza.limpar(bruto)
    resumo = limpeza.resumo(limpo)

    validos = limpo[limpo["status"] == limpeza.STATUS_VALIDO]
    relatorio = {
        "arquivo": arquivo.name,
        "data_carga": datetime.now().isoformat(timespec="seconds"),
        "data_extracao": _data_extracao(bruto),
        **resumo,
        "periodo": {
            "inicio": validos["data"].min().strftime("%Y-%m-%d") if not validos.empty else None,
            "fim": validos["data"].max().strftime("%Y-%m-%d") if not validos.empty else None,
        },
        "colunas_pessoais_removidas": pessoais,
    }

    backup = fazer_backup(caminho_banco)
    relatorio["backup"] = str(backup) if backup else None
    conn = banco.conectar(caminho_banco)
    try:
        relatorio["carga_id"] = banco.gravar_carga(
            conn, limpo, arquivo.name, relatorio["data_carga"], resumo, relatorio["data_extracao"]
        )
    finally:
        conn.close()

    pasta_relatorio.mkdir(parents=True, exist_ok=True)
    caminho_relatorio = pasta_relatorio / f"relatorio_carga_{relatorio['carga_id']}.json"
    caminho_relatorio.write_text(json.dumps(relatorio, ensure_ascii=False, indent=2), encoding="utf-8")
    relatorio["caminho_relatorio"] = str(caminho_relatorio)
    return relatorio


def _imprimir(relatorio: dict) -> None:
    print(f"Carga {relatorio['carga_id']} de {relatorio['arquivo']}")
    print(f"  período: {relatorio['periodo']['inicio']} a {relatorio['periodo']['fim']}")
    print(f"  lidos: {relatorio['total_lido']}")
    print(f"  aceitos: {relatorio['total_aceito']} ({relatorio['aceitos_sem_hora']} sem horário)")
    print(f"  descartados: {relatorio['total_descartado']}")
    for motivo, quantidade in relatorio["descartes_por_motivo"].items():
        print(f"    {motivo}: {quantidade}")
    print(f"  relatório: {relatorio['caminho_relatorio']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Carrega a base de acidentes da Prefeitura no banco.")
    parser.add_argument("arquivo", nargs="?", type=Path, default=PASTA_RAW / "cat_acidentes.csv")
    parser.add_argument("--baixar", action="store_true", help="baixa a base mais recente antes de carregar")
    args = parser.parse_args(argv)

    if args.baixar:
        print(f"Baixando {URL_BASE}")
        baixar(args.arquivo)
    if not args.arquivo.exists():
        print(f"Arquivo não encontrado: {args.arquivo}. Use --baixar ou informe o caminho.", file=sys.stderr)
        return 1
    try:
        relatorio = carregar(args.arquivo)
    except limpeza.ColunasAusentesError as erro:
        print(f"Carga interrompida. {erro}. Confira se o arquivo é a base de acidentes da EPTC.", file=sys.stderr)
        return 2
    _imprimir(relatorio)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
