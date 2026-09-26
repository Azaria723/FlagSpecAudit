from pathlib import Path


SOURCE = (Path(__file__).parents[1] / "frontend" / "src" / "App.jsx").read_text(encoding="utf-8")


def test_wallet_lifecycle_is_observed():
    for token in ["eth_accounts", "eth_chainId", "accountsChanged", "chainChanged", "removeListener"]:
        assert token in SOURCE


def test_wrong_account_and_chain_block_writes():
    assert "Wallet account changed. Reconnect before writing." in SOURCE
    assert "Wrong network. Switch wallet to StudioNet" in SOURCE
    assert 'const CHAIN_ID = "0xf22f"' in SOURCE


def test_rpc_failure_preserves_authoritative_state():
    assert "retryRead" in SOURCE
    assert "preserving the last verified snapshot" in SOURCE
    assert "no zero-state substitution" in SOURCE
    assert "Canonical state unavailable" in SOURCE


def test_transaction_outcomes_and_recovery_are_explicit():
    for outcome in ["SUBMITTED", "PENDING", "FINALIZED", "REVERTED", "REJECTED", "TIMEOUT", "FAILED"]:
        assert outcome in SOURCE
    assert 'localStorage.setItem("fsa:lastTx"' in SOURCE
    assert "Check status" in SOURCE
    assert "canonical contract read" in SOURCE
