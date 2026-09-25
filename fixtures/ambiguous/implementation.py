def extract_with_adapter(adapter, archive_path: str, output_path: str):
    return adapter.extract(archive_path, output_path, enforce_policy=True)
