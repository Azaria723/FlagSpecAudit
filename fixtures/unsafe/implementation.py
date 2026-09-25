import subprocess

def inspect(path: str) -> bytes:
    return subprocess.run("tar -tf " + path, shell=True, check=True, capture_output=True).stdout
