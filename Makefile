TESTS = tests/*.js
tests:
	mocha --timeout 5000 --reporter nyan $(TESTS)

.PHONY: tests