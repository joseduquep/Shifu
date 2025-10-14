declare module "@xenova/transformers" {
  export function pipeline(
    task: string,
    model?: string,
    options?: {
      quantized?: boolean
      progress_callback?: ((progress: unknown) => void) | undefined
    }
  ): Promise<
    (
      text: string,
      opts?: { pooling?: "mean" | "cls"; normalize?: boolean }
    ) => Promise<{ data: Float32Array }>
  >
}
