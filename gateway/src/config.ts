export const config = {
  port: Number(process.env.PORT ?? 8788),
  masterKey: process.env.SF_MASTER_KEY ?? "sk-sf-change-me",
  providerKeys: {
    deepseek: process.env.DEEPSEEK_API_KEY ?? "",
    siliconflow: process.env.SILICONFLOW_API_KEY ?? "",
    openai: process.env.OPENAI_API_KEY ?? "",
    moonshot: process.env.MOONSHOT_API_KEY ?? "",
  } as Record<string, string>,
};
