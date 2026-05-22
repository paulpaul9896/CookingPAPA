const GEMINI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

export async function geminiJson<T>(
  apiKey: string,
  model: string,
  userParts: object[],
  systemPrompt: string,
): Promise<T> {
  const url = GEMINI_URL(model, apiKey);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: userParts }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text) as T;
}

export async function generateRecipe(
  apiKey: string,
  name: string,
  style: string,
  serving: string,
): Promise<{ flavor: string; ingredients: string; steps: string; tags: string[]; kcal: number }> {
  if (!apiKey) throw new Error('MISSING_API_KEY');
  const modelName = 'gemini-2.5-flash';
  let promptTxt = `請用廣東話提供「${name}」詳細食譜。`;
  if (style) promptTxt += `風格：${style}。`;
  if (serving) promptTxt += `份量要求：${serving}。`;

  const systemPrompt = `只准輸出純 JSON，格式：{"flavor":"風格名","ingredients":"材料1\\n材料2 (必須用 \\n 分隔每項)","steps":"1. 步驟一\\n2. 步驟二 (必須用 \\n 分隔每個步驟)","tags":["標籤"],"kcal":350}`;

  let lastError: Error | null = null;
  for (let i = 0; i < 3; i++) {
    try {
      return await geminiJson(apiKey, modelName, [{ text: promptTxt }], systemPrompt);
    } catch (e) {
      lastError = e as Error;
      if (i < 2) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

export async function estimateKcal(
  apiKey: string,
  dishName: string,
  ingredients: string,
): Promise<{ kcal: number }> {
  const prompt = `請估算「${dishName}」的總卡路里。材料如下：\n${ingredients}`;
  return geminiJson(apiKey, 'gemini-2.5-flash', [{ text: prompt }], `你是一位營養師。只准輸出純 JSON：{"kcal":整數數字}`);
}

export async function fridgeSearch(
  apiKey: string,
  input: string,
  file: File | null,
): Promise<Array<{ name: string; flavor: string; ingredients: string; steps: string; tags: string[]; kcal: number }>> {
  let promptMsg = `請幫我諗 3 道唔同嘅家常菜食譜，用廣東話輸出完整資料。`;
  if (file && input) {
    promptMsg = `請根據相片入面嘅食材，加上以下特別要求：「${input}」，` + promptMsg;
  } else if (file) {
    promptMsg = `請根據相片入面嘅食材，` + promptMsg;
  } else {
    promptMsg = `我雪櫃有以下食材或要求：${input}。` + promptMsg;
  }
  promptMsg += ` (請提供 3 個與上次唔同嘅全新建議，隨機防緩存編號: ${Math.floor(Math.random() * 10000)})`;

  const parts: object[] = [{ text: promptMsg }];
  if (file) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    parts.push({ inlineData: { data: base64.split(',')[1], mimeType: file.type } });
  }

  const systemPrompt = `只准輸出純 JSON Array：[{"name":"食譜名","flavor":"口味特色","ingredients":"材料1\\n材料2 (必須用 \\n 分隔每項)","steps":"1. 步驟一\\n2. 步驟二 (必須用 \\n 分隔每個步驟)","tags":["標籤"], "kcal":整數數字}]`;
  return geminiJson(apiKey, 'gemini-2.5-flash', parts, systemPrompt);
}

export async function calculateCalorie(
  apiKey: string,
  textInput: string,
  weightInput: string,
  file: File | null,
): Promise<{ name: string; kcal: number; desc: string }> {
  let promptMsg = `估算食物卡路里。文字提示：${textInput}。`;
  if (weightInput) promptMsg += `實際份量為：${weightInput}克(g)。`;
  promptMsg += `請以 JSON 輸出。`;

  const parts: object[] = [{ text: promptMsg }];
  if (file) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    parts.push({ inlineData: { data: base64.split(',')[1], mimeType: file.type } });
  }

  return geminiJson(apiKey, 'gemini-2.5-flash', parts, `你是一位營養師。只准輸出純 JSON：{"name":"食物名","kcal":350,"desc":"簡短說明"}`);
}

export function resizeImage(file: File, cb: (data: string) => void) {
  const r = new FileReader();
  r.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h) { if (w > 800) { h *= 800 / w; w = 800; } }
      else { if (h > 800) { w *= 800 / h; h = 800; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = e.target!.result as string;
  };
  r.readAsDataURL(file);
}
