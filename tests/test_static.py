from pathlib import Path
S=(Path(__file__).parents[1]/"contracts"/"FlagSpecAudit.py").read_text()
def test_runtime_and_primitives():
    assert S.startswith('# v0.2.16\n# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }')
    for term in ["prompt_comparative","/git/commits/","?recursive=1","_blob_sha1","sha256"]:assert term in S
def test_matrix_architecture_not_graph_clone():
    for term in ["coverage_bitmap","attach_evidence","seal_audit","DOCUMENTATION","IMPLEMENTATION","TESTS"]:assert term in S
    for term in ["parent_id","depth","submit_backport","create_fix_root"]:assert term not in S
def test_no_deployer_authority():
    lowered=S.lower();assert "owner:" not in lowered and "admin:" not in lowered and "only_deployer" not in lowered
