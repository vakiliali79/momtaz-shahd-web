"""Writes the `admin` namespace of messages/{fa,en,ar}.json from admin_*.py, and the
*_OTHER dicts of admin_*.py and site_*.py into the other namespaces."""
import glob, importlib.util, json, os

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, "..", "..")

def merge(a, b):
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(a.get(k), dict):
            merge(a[k], v)
        else:
            a[k] = v

combined = {"en": {}, "fa": {}, "ar": {}}
for path in sorted(glob.glob(os.path.join(HERE, "admin_*.py")) + glob.glob(os.path.join(HERE, "site_*.py"))):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    for lang, attr in (("en", "EN"), ("fa", "FA"), ("ar", "AR")):
        merge(combined[lang], getattr(module, attr, {}))
    for lang, attr in (("en", "EN_OTHER"), ("fa", "FA_OTHER"), ("ar", "AR_OTHER")):
        extra = getattr(module, attr, None)
        if extra:
            combined.setdefault(lang + "_other", {})
            merge(combined[lang + "_other"], extra)

for lang in ("fa", "en", "ar"):
    file = os.path.join(ROOT, "messages", f"{lang}.json")
    data = json.load(open(file, encoding="utf8"))
    data["admin"] = combined[lang]
    merge(data, combined.get(lang + "_other", {}))
    json.dump(data, open(file, "w", encoding="utf8"), ensure_ascii=False, indent=2)
    open(file, "a").write("\n")
print("admin messages written")
