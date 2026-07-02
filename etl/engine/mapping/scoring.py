"""
Column name normalization for string-distance matching.
Normalization is a pure function — no I/O, no state.
"""
import re


def normalize_col_name(name: str) -> str:
    """
    Lowercases, strips leading/trailing whitespace, replaces non-alphanumeric
    characters with a single space, and collapses multiple spaces.
    """
    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9]+", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name
