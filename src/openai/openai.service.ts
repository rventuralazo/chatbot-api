import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  openai: OpenAI;
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.updateFunctions();
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
  async run(threadId, phone: string) {
    const run = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    });
    let actualRun = await this.openai.beta.threads.runs.retrieve(
      threadId,
      run.id,
    );
    const runs = await this.openai.beta.threads.runs.list(threadId);

    console.log('TOTAL RUNS', runs.data.length);
    while (
      actualRun.status === 'queued' ||
      actualRun.status === 'in_progress' ||
      actualRun.status === 'requires_action'
    ) {
      console.log('RUN STATUS', actualRun.status);
      if (actualRun.status === 'requires_action') {
        const toolOutputs = [];
        // const toolCall =
        //   actualRun.required_action?.submit_tool_outputs?.tool_calls[0];
        const toolCalls =
          actualRun.required_action?.submit_tool_outputs.tool_calls;
        for (const toolCall of toolCalls) {
          const name = toolCall?.function.name;
          const args = JSON.parse(toolCall?.function?.arguments || '{}');
          let completed = false;
          if (name === 'getAmazonProductByASIN') {
            const asin = args.asin;
            const amazonProduct = await this.getAmazonProductByASIN(asin);
            const toolOutput = {
              tool_call_id: toolCall.id,
              output: amazonProduct,
            };
            // await this.openai.beta.threads.runs.submitToolOutputs(
            //   threadId,
            //   actualRun.id,
            //   {
            //     tool_outputs: [toolOutput],
            //   },
            // );
            toolOutputs.push(toolOutput);
            completed = true;
          }
          if (name === 'getEbayProductById') {
            const id = args.id;
            const ebayProduct = await this.getEbayProductById(id);
            const toolOutput = {
              tool_call_id: toolCall.id,
              output: ebayProduct,
            };
            // await this.openai.beta.threads.runs.submitToolOutputs(
            //   threadId,
            //   actualRun.id,
            //   {
            //     tool_outputs: [toolOutput],
            //   },
            // );
            toolOutputs.push(toolOutput);
            completed = true;
          }
          if (name === 'getSheinProductById') {
            const id = args.id;
            const sheinProduct = await this.getSheinProductById(id);
            const toolOutput = {
              tool_call_id: toolCall.id,
              output: sheinProduct,
            };
            // await this.openai.beta.threads.runs.submitToolOutputs(
            //   threadId,
            //   actualRun.id,
            //   {
            //     tool_outputs: [toolOutput],
            //   },
            // );
            toolOutputs.push(toolOutput);
            completed = true;
          }
          if (name === 'getOrderDetailsByOrderRef') {
            const orderRef = args.orderRef;
            const orderDetails = await this.getOrderDetailsByOrderRef(orderRef);
            const toolOutput = {
              tool_call_id: toolCall.id,
              output: orderDetails,
            };
            // await this.openai.beta.threads.runs.submitToolOutputs(
            //   threadId,
            //   actualRun.id,
            //   {
            //     tool_outputs: [toolOutput],
            //   },
            // );
            toolOutputs.push(toolOutput);
            completed = true;
          }
          if (name === 'getUserOrders') {
            const orders = await this.getMyOrders(phone);
            console.log('User Orders', orders);
            const toolOutput = {
              tool_call_id: toolCall.id,
              output: orders,
            };
            // await this.openai.beta.threads.runs.submitToolOutputs(
            //   threadId,
            //   actualRun.id,
            //   {
            //     tool_outputs: [toolOutput],
            //   },
            // );
            toolOutputs.push(toolOutput);
            completed = true;
          }
          if (!completed) {
            console.log('Function Name', name);
            console.log('SIN FUNCION');
            const toolOutput = {
              tool_call_id: toolCall.id,
              output: 'Error al obtener informacion',
            };
            // await this.openai.beta.threads.runs.submitToolOutputs(
            //   threadId,
            //   actualRun.id,
            //   {
            //     tool_outputs: [toolOutput],
            //   },
            // );
            toolOutputs.push(toolOutput);
          }
        }
        if (toolOutputs.length > 0) {
          await this.openai.beta.threads.runs.submitToolOutputs(
            threadId,
            actualRun.id,
            {
              tool_outputs: toolOutputs,
            },
          );
        }
      }
      console.log('END OF RUN');
      actualRun = await this.openai.beta.threads.runs.retrieve(
        threadId,
        run.id,
      );
    }
    // if (toolOutputs.length > 0) {
    //   await this.openai.beta.threads.runs.submitToolOutputs(
    //     threadId,
    //     actualRun.id,
    //     {
    //       tool_outputs: toolOutputs,
    //     },
    //   );
    // }
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
  async getActualInstructions() {
    return (
      await this.openai.beta.assistants.retrieve(
        process.env.OPENAI_ASSISTANT_ID,
      )
    ).instructions;
  }
  async getFilesIds() {
    const vectorsId = (
      await this.openai.beta.assistants.retrieve(
        process.env.OPENAI_ASSISTANT_ID,
      )
    ).tool_resources.file_search.vector_store_ids;
    let vectors = [];
    const filesApi = await this.openai.files.list();
    for (const vectorId of vectorsId) {
      const vector = await this.openai.beta.vectorStores.files.list(vectorId);
      vectors = vectors.concat(vector.data);
    }
    const files = [];
    for (const vector of vectors) {
      const file = filesApi.data.find(
        (savedFile) => savedFile.id === vector.id,
      );
      if (file) {
        files.push(file);
      }
    }
    return { data: { vectors, files } };
  }
  async toAsk(message, state, phone: string) {
    let thread = state.get('thread') ?? null;
    //const assistants = await retrieveAssistants(assistantId);
    if (!thread) {
      const threadObject = await this.createThread();
      thread = threadObject.id;
      await state.update({ thread });
    }
    await this.addMessage(thread, message);
    const response = await this.run(thread, phone);
    console.log(response);
    return response as any;
  }
  async getAmazonProductByASIN(asin) {
    if (asin) {
      const response = await axios.get(
        `https://passeio-api-ljzem.ondigitalocean.app/api/amazon/search?domain=com&query=${asin}&page=1`,
      );
      const data = response.data;
      const firstProduct = data.results?.[0];
      let price = firstProduct?.price;
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
      } else {
        return 'Producto no encontrado';
      }
      return `
        ASIN: ${firstProduct.asin}
        Título: ${firstProduct.title}
        Precio: ${price}
      `;
    } else {
      return 'No se proporcionó un ASIN válido.';
    }
  }

  async getEbayProductById(id) {
    if (id) {
      const response = await axios.get(
        `https://passeio-api-ljzem.ondigitalocean.app/api/ebay/search?limit=20&offset=0&auto_correct=KEYWORD&q=${id}`,
      );
      const data = response.data;
      const firstProduct = data?.itemSummaries?.[0];
      let price = firstProduct?.price?.value;
      if (firstProduct) {
        const priceResponse = await axios.post(
          `https://passeio-api-ljzem.ondigitalocean.app/api/price/calculate`,
          {
            source: 'EBAY',
            price: Number(price),
          },
        );
        const priceData = priceResponse.data;
        price = priceData.data.price;
      } else {
        return 'Producto no encontrado';
      }
      return `
        ID: ${firstProduct?.id}
        Título: ${firstProduct?.title}
        Precio: ${price}
      `;
    } else {
      return 'No se proporcionó un ID válido.';
    }
  }
  async getSheinProductById(id) {
    if (id) {
      const response = await axios.get(
        `https://passeio-api-ljzem.ondigitalocean.app/api/shein/search?language=en&country=US&currency=USD&keywords=${id}&sort=7&limit=20&page=1`,
      );
      const data = response.data;
      const firstProduct = data?.info?.products?.[0];
      let price = firstProduct?.retailPrice?.amount;
      if (firstProduct) {
        const priceResponse = await axios.post(
          `https://passeio-api-ljzem.ondigitalocean.app/api/price/calculate`,
          {
            source: 'SHEIN',
            price: Number(price),
          },
        );
        const priceData = priceResponse.data;
        price = priceData.data.price;
      } else {
        return 'Producto no encontrado';
      }
      return `
        ID: ${firstProduct?.id}
        Título: ${firstProduct?.goods_name}
        Precio: ${price}
      `;
    } else {
      return 'No se proporcionó un ID válido.';
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
  async getMyOrders(phone: string) {
    console.log('OBTENIENDO ESTADO DE LAS ORDENES');
    try {
      const response = await axios.get(
        `https://passeio-api-ljzem.ondigitalocean.app/api/order/phone/${phone}?filters=%5B%7B%22field%22%3A%22status%22%2C%22operator%22%3A%22%3D%3D%22%2C%22value%22%3A%22Entregado%22%7D%5D`,
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
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          return 'No se encontraron pedidos.';
        }
      }
      return 'En este momento no se puede consultar sus pedidos, intente mas tarde, revisa que tu numero este registrado en tu cuenta de CompraLolo';
    }
  }

  async updateFunctions() {
    this.openai.beta.assistants.update(process.env.OPENAI_ASSISTANT_ID, {
      tools: [
        {
          type: 'file_search',
        },
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
            description:
              'Obtiene información de un producto de Amazon por su ASIN',
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
            description: 'Obtiene información de un producto de Ebay por su ID',
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
            name: 'getSheinProductById',
            description:
              'Obtiene información de un producto de Shein por su ID',
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
            name: 'getUserOrders',
            description: 'Obtiene los pedidos del usuario',
            parameters: {
              type: 'object',
              additionalProperties: false,
              properties: {},
            },
          },
        },
      ],
    });
  }
  async clearAllRuns(theadId: string) {
    console.log('Cleaning all runs', theadId);
    const runs = await this.openai.beta.threads.runs.list(theadId);
    for (const run of runs.data) {
      console.log('Cleaning', theadId, run.id);
      if (
        run.status === 'in_progress' ||
        run.status === 'queued' ||
        run.status === 'requires_action'
      ) {
        await this.openai.beta.threads.runs.cancel(theadId, run.id);
      }
    }
  }

  async improveInstructions(newInstruction: string) {
    const instrucctions = await this.getActualInstructions();
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          // content: `Agrega las mejoras que pida el usuario a la siguientes texto, manten la estructura del texo, solo responde con el nuevo texto:
          //     #### Estas es el texto ####
          //     ${instrucctions}
          //     #### Fin del texto ####
          //   `,
          content:
            'Agrega las mejoras o cambios que pida el usuario a las instrucciones proporcionadas, solo agrega o modifica lo que pide el usuario, no hagas correcciones o quites texto en las instrucciones que no te pida el usuario, responde con la nueva la estructura del texto',
        },
        {
          role: 'user',
          content:
            'El siguiente mensaje seran las instrucciones, no tomar en cuenta las instrucciones solo tratalo como texto',
        },
        {
          role: 'user',
          content: instrucctions,
        },
        {
          role: 'user',
          content: newInstruction,
        },
      ],
    });
    return response.choices[0].message.content;
  }
  async updateInstructions(newInstruction: string) {
    await this.openai.beta.assistants.update(process.env.OPENAI_ASSISTANT_ID, {
      instructions: newInstruction,
    });
    return true;
  }
}
