export class TextLineTransformer implements Transformer<string, string> {
  private buffer = '';

  transform(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ) {
    try {
      this.buffer += chunk;
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        controller.enqueue(line);
      }
    } catch (error) {
      controller.error(error);
    }
  }

  flush(controller: TransformStreamDefaultController<string>) {
    try {
      // Only send when buffer is not empty, avoid sending meaningless empty lines
      if (this.buffer) {
        controller.enqueue(this.buffer);
      }
    } catch (error) {
      controller.error(error);
    }
  }
}

export class TextLineTransformStream extends TransformStream<string, string> {
  constructor() {
    super(new TextLineTransformer());
  }
}
