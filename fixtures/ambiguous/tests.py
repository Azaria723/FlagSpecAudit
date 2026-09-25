def test_adapter_is_called(adapter, extractor):
    extractor(adapter, "archive.tar", "output")
    adapter.extract.assert_called_once()
