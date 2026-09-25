from implementation import sanitize_member

def test_absolute_prefix_is_removed():
    assert sanitize_member("/tmp/file") == "tmp/file"
