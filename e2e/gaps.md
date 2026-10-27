Features not covered by playwright testing:

- Presets: each preset needs to be checked manually
- Scrubbing sites: Needs to be checked manually for each search engine
- Time limits reset on new day: Needs to be tested by directly changing the storage in browser. Specifically, change "last_updated_day" to anything but today. You must do this by sending an "update_storage" message to update the cache properly.
- Element removal on SPAs: I couldn't make a good automated test for this
- Feedback works correctly, not tested as the feedback method is subject to change