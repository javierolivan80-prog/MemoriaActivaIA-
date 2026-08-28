import Retell from "retell-sdk";
import type { ElderlyProfile, Memory } from "@/types";

let retellClient: Retell | null = null;

function getRetellClient(): Retell {
  if (!retellClient) {
    retellClient = new Retell({ apiKey: process.env.RETELL_API_KEY! });
  }
  return retellClient;
}

function familyInfoToText(familyInfo: Record<string, unknown>): string {
  if (
    typeof familyInfo.description === "string" &&
    familyInfo.description.trim()
  ) {
    return familyInfo.description;
  }

  const entries = Object.entries(familyInfo).filter(
    ([, value]) => typeof value === "string" && value.trim()
  );

  if (entries.length === 0) return "sin información registrada";
  return entries.map(([key, value]) => `${key}: ${value}`).join("; ");
}

export function buildAgentPrompt(
  profile: ElderlyProfile,
  recentMemories: Memory[]
): string {
  const lines: string[] = [];

  lines.push(
    `Eres un acompañante telefónico cálido y cercano que llama regularmente a ${profile.name}` +
      (profile.age ? `, de ${profile.age} años,` : ",") +
      " para charlar y hacerle compañía en nombre de su familia."
  );

  lines.push("");
  lines.push("SOBRE LA PERSONA:");
  lines.push(`- Nombre: ${profile.name}`);
  if (profile.age) lines.push(`- Edad: ${profile.age} años`);
  lines.push(`- Familia: ${familyInfoToText(profile.family_info)}`);

  const interests = Array.from(
    new Set([...profile.interests, ...profile.hobbies])
  );
  if (interests.length > 0) {
    lines.push(`- Intereses y hobbies: ${interests.join(", ")}`);
  }
  if (profile.routines.length > 0) {
    lines.push(`- Rutina diaria: ${profile.routines.join(", ")}`);
  }
  if (profile.favorite_topics.length > 0) {
    lines.push(
      `- Temas que le encanta comentar: ${profile.favorite_topics.join(", ")}`
    );
  }
  if (profile.sensitive_topics.length > 0) {
    lines.push(
      `- Temas sensibles a tratar con mucho cuidado (no los saques tú, y si surgen responde con delicadeza): ${profile.sensitive_topics.join(", ")}`
    );
  }

  if (recentMemories.length > 0) {
    lines.push("");
    lines.push(
      "COSAS QUE RECUERDAS DE CONVERSACIONES ANTERIORES (menciónalas de forma natural si vienen a cuento):"
    );
    for (const memory of recentMemories.slice(0, 5)) {
      lines.push(`- ${memory.content}`);
    }
  }

  lines.push("");
  lines.push("CÓMO DEBES HABLAR:");
  lines.push(
    "- Habla en español, de forma cálida, natural y pausada, como lo haría un familiar cercano. Nunca suenes robótico ni como un cuestionario."
  );
  lines.push(
    "- Escucha más de lo que hablas, deja espacio para que se explaye y reacciona con interés genuino."
  );
  lines.push(
    "- Haz referencia a conversaciones anteriores cuando tenga sentido, para que sienta continuidad y que de verdad te acuerdas de ella."
  );
  lines.push(
    "- Si detectas algo preocupante (tristeza, confusión, dolor, una caída, no comer bien, sentirse muy sola), pregúntale con calma para entender mejor, sin alarmarla."
  );
  lines.push(
    "- Despídete con cariño y hazle saber que volverás a llamar pronto."
  );

  return lines.join("\n");
}

interface ExistingRetellIds {
  agentId?: string | null;
  llmId?: string | null;
}

export async function createRetellAgent(
  profile: ElderlyProfile,
  recentMemories: Memory[] = [],
  existing?: ExistingRetellIds
): Promise<{ agentId: string; llmId: string }> {
  const client = getRetellClient();
  const generalPrompt = buildAgentPrompt(profile, recentMemories);
  const beginMessage = `Hola ${profile.name}, ¿qué tal estás?`;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook`;

  const llm = existing?.llmId
    ? await client.llm.update(existing.llmId, {
        general_prompt: generalPrompt,
        begin_message: beginMessage,
      })
    : await client.llm.create({
        general_prompt: generalPrompt,
        begin_message: beginMessage,
      });

  const agentParams = {
    response_engine: { llm_id: llm.llm_id, type: "retell-llm" as const },
    voice_id: process.env.RETELL_VOICE_ID!,
    agent_name: `Memoria Activa - ${profile.name}`,
    language: "es-ES" as const,
    webhook_url: webhookUrl,
  };

  const agent = existing?.agentId
    ? await client.agent.update(existing.agentId, agentParams)
    : await client.agent.create(agentParams);

  return { agentId: agent.agent_id, llmId: llm.llm_id };
}

export async function makeCall(
  phoneNumber: string,
  agentId: string,
  dynamicVariables?: Record<string, string>
): Promise<{ callId: string }> {
  const client = getRetellClient();

  const call = await client.call.createPhoneCall({
    from_number: process.env.RETELL_FROM_NUMBER!,
    to_number: phoneNumber,
    override_agent_id: agentId,
    retell_llm_dynamic_variables: dynamicVariables,
  });

  return { callId: call.call_id };
}

export async function getCallTranscript(
  callId: string
): Promise<string | null> {
  const client = getRetellClient();
  const call = await client.call.retrieve(callId);
  return call.transcript ?? null;
}

export { verify as verifyRetellWebhookSignature } from "retell-sdk";
