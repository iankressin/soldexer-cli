import { SingleBar, Presets } from 'cli-progress';

export class ProgressBarManager {
  private progressBar: SingleBar;
  private totalMB: number;

  constructor(totalBytes: number) {
    this.totalMB = Math.round(totalBytes / 1024 / 1024 * 100) / 100;
    
    this.progressBar = new SingleBar({
      format: 'Upload Progress |{bar}| {percentage}% || {value}/{total} MB',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    }, Presets.shades_classic);
  }

  start(): void {
    this.progressBar.start(this.totalMB, 0);
  }

  update(uploadedBytes: number): void {
    const uploadedMB = Math.round(uploadedBytes / 1024 / 1024 * 100) / 100;
    this.progressBar.update(uploadedMB);
  }

  stop(): void {
    this.progressBar.stop();
  }
}