#!/bin/bash
docker build . -t fwtest
docker run -it --rm --name fwtest --network nginx fwtest
