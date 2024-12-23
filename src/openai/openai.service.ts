import { Injectable } from '@nestjs/common';
import axios from 'axios';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  openai: OpenAI;
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  async createThread() {
    const thread = await this.openai.beta.threads.create();
    return thread;
  }
  async addMessage(threadId, content) {
    const message = await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content,
    });
    return message;
  }
  // async addCustomMessage(threadId, content) {
  //   const message = await this.openai.beta.threads.messages.create(threadId, {
  //     role: 'assistant',
  //     content,
  //   });
  //   return message;
  // }
  async run(threadId) {
    const run = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    });
    let actualRun = await this.openai.beta.threads.runs.retrieve(
      threadId,
      run.id,
    );
    console.log(actualRun);
    while (
      actualRun.status === 'queued' ||
      actualRun.status === 'in_progress' ||
      actualRun.status === 'requires_action'
    ) {
      if (actualRun.status === 'requires_action') {
        const toolCall =
          actualRun.required_action?.submit_tool_outputs?.tool_calls[0];
        const name = toolCall?.function.name;
        const args = JSON.parse(toolCall?.function?.arguments || '{}');
        if (name === 'getAmazonProductByASIN') {
          const asin = args.asin;
          const amazonProduct = await this.getAmazonProductByASIN(asin);
          const toolOutput = {
            tool_call_id: toolCall.id,
            output: amazonProduct,
          };
          await this.openai.beta.threads.runs.submitToolOutputs(
            threadId,
            actualRun.id,
            {
              tool_outputs: [toolOutput],
            },
          );
        }
        if (name === 'getOrderDetailsByOrderRef') {
          const orderRef = args.orderRef;
          const orderDetails = await this.getOrderDetailsByOrderRef(orderRef);
          const toolOutput = {
            tool_call_id: toolCall.id,
            output: orderDetails,
          };
          await this.openai.beta.threads.runs.submitToolOutputs(
            threadId,
            actualRun.id,
            {
              tool_outputs: [toolOutput],
            },
          );
        }
        if (name === 'getMyOrders') {
          const orders = await this.getMyOrders();
          const toolOutput = {
            tool_call_id: toolCall.id,
            output: orders,
          };
          await this.openai.beta.threads.runs.submitToolOutputs(
            threadId,
            actualRun.id,
            {
              tool_outputs: [toolOutput],
            },
          );
        }
      }
      actualRun = await this.openai.beta.threads.runs.retrieve(
        threadId,
        run.id,
      );
    }
    const messages = await this.openai.beta.threads.messages.list(threadId);
    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === 'assistant',
      )
      .pop();
    return (
      lastMessageForRun?.content[0] as unknown as {
        text: {
          value: string;
        };
      }
    )?.text?.value;
  }
  async toAsk(message, state) {
    let thread = state.get('thread') ?? null;
    //const assistants = await retrieveAssistants(assistantId);
    if (!thread) {
      const threadObject = await this.createThread();
      thread = threadObject.id;
      await state.update({ thread });
    }
    await this.addMessage(thread, message);
    const response = await this.run(thread);
    console.log(response);
    return response as any;
  }
  async getAmazonProductByASIN(asin) {
    if (asin) {
      const response = await axios.get(
        `https://passeio-api-ljzem.ondigitalocean.app/api/amazon/search?domain=com&query=${asin}&page=1`,
      );
      const data = response.data;
      const firstProduct = data.results[0];
      let price = firstProduct.price;
      if (firstProduct) {
        const priceResponse = await axios.post(
          `https://passeio-api-ljzem.ondigitalocean.app/api/price/calculate`,
          {
            source: 'AMAZON',
            price: Number(price.replace('$', '')),
          },
        );
        const priceData = priceResponse.data;
        price = priceData.data.price;
      }
      return `
        ASIN: ${firstProduct.asin}
        Título: ${firstProduct.title}
        Precio: ${firstProduct.price}
      `;
    } else {
      return 'No se proporcionó un ASIN válido.';
    }
  }
  async getOrderDetailsByOrderRef(orderRef) {
    if (orderRef) {
      try {
        const response = await axios.get(
          `https://passeio-api-ljzem.ondigitalocean.app/api/order/${orderRef}`,
        );
        const data = response.data;
        return `
          ID: ${data.id}
          Estado: ${data.status}
          Producto: ${data.product.nameProduct}
          Fecha de Llegada: ${data.arrivalDate}
          Total: ${data.total}
        `;
      } catch {
        return 'En este momento no se puede consultar el pedido, intente mas tarde';
      }
    } else {
      return 'No se proporcionó una referencia de pedido válida.';
    }
  }
  async getMyOrders() {
    const response = await axios.get(
      'https://passeio-api-ljzem.ondigitalocean.app/api/order/phone/50371668439?filters=%5B%7B%22field%22%3A%22status%22%2C%22operator%22%3A%22%3D%3D%22%2C%22value%22%3A%22Entregado%22%7D%5D',
    );
    const data = response.data.data.bulk;
    return `
      ${data
        .map((order) => {
          return `
          ID: ${order.id}
          Estado: ${order.status}
          Producto: ${order.product.nameProduct}
          Fecha de Llegada: ${order.arrivalDate}
          Total: ${order.total}
        `;
        })
        .join('\n')}
    `;
  }
}
