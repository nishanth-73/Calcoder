"use client";

import { ToolLayout } from "@/components/layout/ToolLayout";
import { MediaTool } from "@/components/ui/MediaTool";

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * numChannels * bytesPerSample;
  const totalLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); view.setUint32(4, totalLength - 8, true);
  w(8, "WAVE"); w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  w(36, "data"); view.setUint32(40, dataLength, true);
  let offset = 44;
  const chData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) chData.push(buffer.getChannelData(c));
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, chData[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default function MediaToolPage() {
  return (
    <ToolLayout
      title="MP4 to MP3"
      description="Extract audio from MP4 video files and download as WAV audio, all in your browser."
      category="media"
      faqContent={[
        { question: "How does audio extraction work in the browser?", answer: "The tool uses the Web Audio API (AudioContext.decodeAudioData) to extract the audio track from video files. It decodes the audio stream into raw PCM samples and encodes them as a WAV file. This process happens entirely in your browser-no server uploads are required." },
        { question: "Can I convert formats other than MP4?", answer: "Yes, the tool supports all video formats modern browsers can decode, including MP4 (H.264), WebM (VP8/VP9), Ogg (Theora), and MOV. Chrome and Firefox have the widest format support." },
        { question: "Why is the output WAV instead of MP3?", answer: "True MP3 encoding requires a patent-encumbered library or a large dependency like FFmpeg.wasm (>30MB download). WAV is a lossless PCM format that preserves full audio quality and is universally playable." },
        { question: "Is the audio quality preserved?", answer: "Yes. The tool uses 16-bit PCM encoding at the source video's original sample rate. The output is bit-perfect relative to the decoded audio, retaining full fidelity." },
        { question: "Are there file size limits?", answer: "The default limit is 50MB. Since processing is client-side, very large files may consume significant memory. For files over 100MB, consider using a dedicated desktop tool." },
        { question: "What happens to my files after processing?", answer: "Files are processed entirely in memory within your browser. No data is uploaded to any server. Once you close the page, all file data is garbage collected." },
        { question: "Which browsers support audio extraction from video?", answer: "Chrome, Firefox, Edge, and Safari all support AudioContext.decodeAudioData for container formats they natively support. Chrome and Firefox offer the broadest codec support." },
        { question: "Can I use the WAV output directly in my projects?", answer: "Absolutely. WAV files work natively in all operating systems, audio software (Audacity, FL Studio, Logic), and web applications. The format is uncompressed and immediately editable." },
      ]}
      explanationContent={
        <div>
          <h2>What Is MP4 to WAV Audio Extraction?</h2>
          <p>This tool extracts the audio track from a video file and converts it to WAV format using the Web Audio API. It is a fully client-side solution that never uploads your files to any server.</p>
          <h2>How It Works</h2>
          <p>The tool reads the video file as an ArrayBuffer and passes it to AudioContext.decodeAudioData(), which decodes the audio stream into raw PCM samples. The samples are interleaved across channels and written into a WAV container with the standard RIFF header, sample rate metadata, and 16-bit integer encoding. The resulting blob is made available for download.</p>
          <h2>Features</h2>
          <ul>
            <li><strong>Client-side processing:</strong> No uploads, no servers, no privacy concerns.</li>
            <li><strong>Lossless audio:</strong> Full 16-bit PCM encoding at the original sample rate.</li>
            <li><strong>Multi-format support:</strong> Works with MP4, WebM, MOV, and other browser-supported containers.</li>
            <li><strong>Multi-channel:</strong> Preserves stereo and multi-channel audio tracks without downmixing.</li>
          </ul>
          <h2>Use Cases</h2>
          <ul>
            <li>Extracting audio from video clips for podcast or voiceover editing.</li>
            <li>Converting video lectures to audio-only study files for mobile listening.</li>
            <li>Pulling background music from videos for sampling or remixing.</li>
            <li>Archiving audio tracks from personal video recordings.</li>
          </ul>
          <h2>Examples</h2>
          <ul>
            <li>A 50MB MP4 with 192 kbps AAC audio produces a ~30MB WAV at 44100 Hz stereo 16-bit.</li>
            <li>A 10-minute 1080p video extracts to approximately 100MB of lossless WAV audio.</li>
          </ul>
          <h2>Tips</h2>
          <ul>
            <li>Use smaller source files for faster processing-video resolution does not affect audio quality.</li>
            <li>The WAV output can be compressed to MP3 using a separate tool if file size is a concern.</li>
            <li>Chrome and Firefox have the best codec support; Safari may reject some formats.</li>
          </ul>
          <h2>Common Mistakes</h2>
          <ul>
            <li>Expecting MP3 output directly-MP3 encoding is not available without a heavy client-side library.</li>
            <li>Uploading files without audio tracks-verify your source file has an audio stream.</li>
            <li>Using unsupported codecs like HEVC (H.265)-stick to H.264 or VP9 for best compatibility.</li>
          </ul>
        </div>
      }
    >
      <MediaTool
        acceptedFileTypes=".mp4,.webm,.ogg,.mov"
        processLabel="Extract Audio"
        processFile={async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const audioContext = new AudioContext();
          try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            return audioBufferToWav(audioBuffer);
          } finally {
            await audioContext.close();
          }
        }}
        getDownloadFileName={(name) => name.replace(/\.[^.]+$/, "") + ".wav"}
        getMimeType={() => "audio/wav"}
        showImagePreview
      />
    </ToolLayout>
  );
}
