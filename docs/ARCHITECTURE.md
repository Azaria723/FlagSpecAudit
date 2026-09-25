# Architecture

FlagSpecAudit separates deterministic lifecycle state from semantic judgment. The contract owns audit IDs, creators, evidence coverage, slot identity, sealing, counters, and terminality. Validators may only return a bounded verdict, confidence, reason, and three support booleans.

The `0b111` coverage bitmap proves that documentation, implementation, and tests were attached before sealing. A source may originate from any public GitHub repository and author if its immutable provenance verifies.
