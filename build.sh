#!/bin/bash

npx webpack
npx web-ext build --overwrite-dest --ignore-files src/ web-ext-artifacts/ package* *config* build.sh