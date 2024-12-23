import { addKeyword, MemoryDB as Database, EVENTS } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { typing } from '../utils/presence';
// import { toAsk } from '../ai/openai';

//const PORT = process.env.PORT ?? 3008
// const ASSISTANT_ID = process.env?.OPENAI_ASSISTANT_ID;

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME).addAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (ctx, { flowDynamic, state, provider }) => {
    console.dir(ctx);
    console.log(state);
    await typing(ctx, provider);
    flowDynamic([{ body: 'Hello, I am a chatbot!' }]);
    // const response = await toAsk(ASSISTANT_ID, ctx.body, state);
    // const chunks = response.split(/(?<!\d)\.\s+/g);
    // for (const chunk of chunks) {
    //   await flowDynamic([{ body: chunk.trim() }]);
    // }
  },
);

export default welcomeFlow;
