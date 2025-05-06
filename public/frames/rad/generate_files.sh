#!/bin/bash
# naming: layer_alt-idx_fl-idx.gif

for alt_idx in {0..13}; do
  # Loop over each month
  for flt_idx in {0..8}; do
    idx=$(( (flt_idx + alt_idx) % 14 ))
    printf -v idx_padded "%05d" "$idx"
    cp layer${idx_padded}.gif layer_${alt_idx}_${flt_idx}.gif
  done
done