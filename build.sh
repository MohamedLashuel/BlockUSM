#!/bin/bash

npx webpack
npx web-ext build -s dist --overwrite-dest