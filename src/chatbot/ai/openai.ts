import axios from 'axios';
import OpenAI from 'openai';
// import { EventEmitter } from 'stream';

const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID ?? '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
console.log('OPENAI_API_KEY', OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// const retrieveAssistants = async (id) => {
//   const assistant = await openai.beta.assistants.retrieve(id);
//   return assistant;
// };

const createThread = async () => {
  const thread = await openai.beta.threads.create();
  return thread;
};

const addMessage = async (threadId, content) => {
  const message = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
  });
  return message;
};

async function getOrderDetails(orderRef) {
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
async function getAmazonProductByASIN(asin) {
  if (asin) {
    const response = await axios.get(
      `https://passeio-api-ljzem.ondigitalocean.app/api/amazon/search?domain=com&query=${asin}&page=1`,
    );
    const data = response.data;
    const firstProduct = data.results[0];
    console.log('PASSIO RESULT', JSON.stringify(data));
    return `
      ASIN: ${firstProduct.asin}
      Título: ${firstProduct.title}
      Precio: ${firstProduct.price}
    `;
  } else {
    return 'No se proporcionó un ASIN válido.';
  }
}
async function getMyOrders() {
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

openai.beta.assistants.update(OPENAI_ASSISTANT_ID, {
  tools: [
    {
      type: 'function',
      function: {
        strict: true,
        name: 'getOrderDetailsByOrderRef',
        description: 'Obtiene los detalles de un pedido por su referencia',
        parameters: {
          type: 'object',
          properties: {
            orderRef: {
              type: 'string',
              description: 'Referencia del pedido',
            },
          },
          additionalProperties: false,
          required: ['orderRef'],
        },
      },
    },
    {
      type: 'function',
      function: {
        strict: true,
        name: 'getAmazonProductByASIN',
        description: 'Obtiene información de un producto de Amazon por su ASIN',
        parameters: {
          type: 'object',
          properties: {
            asin: {
              type: 'string',
              description: 'ASIN del producto',
            },
          },
          additionalProperties: false,
          required: ['asin'],
        },
      },
    },
    {
      type: 'function',
      function: {
        strict: true,
        name: 'getEbayProductById',
        description: 'Obtiene información de un producto de Amazon por su ID',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID del producto',
            },
          },
          additionalProperties: false,
          required: ['id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        strict: true,
        name: 'getMyOrders',
        description: 'Obtiene los detalles de tus pedidos',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {},
        },
      },
    },
  ],
});

const run = async (threadId) => {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: OPENAI_ASSISTANT_ID,
  });
  let actualRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
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
        const amazonProduct = await getAmazonProductByASIN(asin);
        const toolOutput = {
          tool_call_id: toolCall.id,
          output: amazonProduct,
        };
        await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          actualRun.id,
          {
            tool_outputs: [toolOutput],
          },
        );
      }
      if (name === 'getOrderDetailsByOrderRef') {
        const orderRef = args.orderRef;
        const orderDetails = await getOrderDetails(orderRef);
        const toolOutput = {
          tool_call_id: toolCall.id,
          output: orderDetails,
        };
        await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          actualRun.id,
          {
            tool_outputs: [toolOutput],
          },
        );
      }
      if (name === 'getMyOrders') {
        const myOrders = await getMyOrders();
        const toolOutput = {
          tool_call_id: toolCall.id,
          output: myOrders,
        };
        await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          actualRun.id,
          {
            tool_outputs: [toolOutput],
          },
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    actualRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }
  const messages = await openai.beta.threads.messages.list(threadId);
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
  //});
};
const toAsk = async (message, state) => {
  let thread = state.get('thread') ?? null;
  //const assistants = await retrieveAssistants(assistantId);
  if (!thread) {
    const threadObject = await createThread();
    thread = threadObject.id;
    await state.update({ thread });
  }
  await addMessage(thread, message);
  const response = await run(thread);
  console.log(response);
  return response as any;
};

export { toAsk };
