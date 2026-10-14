/**
 * Offline analysis of a decoded AudioBuffer, used for the timeline waveform.
 */
export function computePeaks(buffer: AudioBuffer, buckets: number): Float32Array {
  const peaks = new Float32Array(buckets);
  const channel = buffer.getChannelData(0);
  const second = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
  const samplesPerBucket = Math.max(1, Math.floor(channel.length / buckets));

  for (let i = 0; i < buckets; i++) {
    const start = i * samplesPerBucket;
    const end = Math.min(start + samplesPerBucket, channel.length);
    let max = 0;
    // Stride through the bucket; sampling every 16th value is plenty for display.
    const step = Math.max(1, Math.floor((end - start) / 64));
    for (let j = start; j < end; j += step) {
      const a = Math.abs(channel[j]);
      const b = second ? Math.abs(second[j]) : 0;
      if (a > max) max = a;
      if (b > max) max = b;
    }
    peaks[i] = max;
  }
  return peaks;
}
