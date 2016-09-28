#!/bin/sh

rollup -c
cp -RL dist/* ../docker-capitains-nemo-nautilus/nemo_plokamos_plugin/nemo_plokamos_plugin/data/assets
date