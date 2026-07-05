import { afterEach, describe, expect, it, vi } from "vitest"
import { isRecordingSupported } from "./use-call-recorder"

describe("isRecordingSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    // @ts-expect-error - test-only cleanup of a prototype method added for the "supported" case
    delete HTMLCanvasElement.prototype.captureStream
  })

  it("returns false when the browser lacks MediaRecorder and canvas.captureStream (e.g. jsdom)", () => {
    expect(isRecordingSupported()).toBe(false)
  })

  it("returns false when MediaRecorder exists but captureStream does not", () => {
    vi.stubGlobal("MediaRecorder", function MediaRecorder() {})

    expect(isRecordingSupported()).toBe(false)
  })

  it("returns true once both MediaRecorder and canvas.captureStream are available", () => {
    vi.stubGlobal("MediaRecorder", function MediaRecorder() {})
    HTMLCanvasElement.prototype.captureStream = function captureStream() {
      return {} as MediaStream
    }

    expect(isRecordingSupported()).toBe(true)
  })
})
