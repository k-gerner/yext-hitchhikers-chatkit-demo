import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { CgFileDocument } from "react-icons/cg";
import { useCallback, useEffect, useState } from "react";

const CHATKIT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/chatkit";
const CHATKIT_API_DOMAIN_KEY = import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY ?? "domain_pk_localhost_dev";

type ReferenceSource = {
  key: string;
  title: string;
  subtitle?: string;
  kind: "url" | "file" | "entity" | "unknown";
};

function openReferencePage(filename: string) {
  const safeFilename = filename.trim() || "unknown";
  const url = `/#reference?filename=${encodeURIComponent(safeFilename)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}


function ReferencesWidgetPanel({
  colorScheme,
  activeThreadId,
  isLoadingReferences,
  referenceSources,
}: {
  colorScheme: "light" | "dark";
  activeThreadId: string | null;
  isLoadingReferences: boolean;
  referenceSources: ReferenceSource[];
}) {
  const panelClasses = [
    "h-[600px] w-[360px] rounded-3xl border shadow-lg overflow-hidden",
    colorScheme === "dark" ? "border-slate-700 bg-black" : "border-gray-200 bg-white",
  ].join(" ");

  return (
    <div className={panelClasses}>
      <div className="h-full w-full overflow-y-auto p-3">
        <div className="flex flex-col gap-3">
          <div className={`text-lg text-center font-semibold ${colorScheme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
            References
          </div>
          <div className={`text-sm ${colorScheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            {activeThreadId ? "From the latest assistant response" : "No thread selected yet"}
          </div>
          <div className={`${colorScheme === "dark" ? "bg-slate-700" : "bg-gray-200"} h-px w-full`} />

          {isLoadingReferences && (
            <div className={`${colorScheme === "dark" ? "text-gray-200" : "text-gray-700"} text-md`}>
              Loading references...
            </div>
          )}

          {!isLoadingReferences && referenceSources.length === 0 && (
            <div className={`${colorScheme === "dark" ? "text-gray-200" : "text-gray-700"} text-md`}>
              No references found in the latest response.
            </div>
          )}

          {!isLoadingReferences && referenceSources.length > 0 && (
            <div className="flex flex-col gap-2">
              {referenceSources.map((source) => {
                const filename =
                  source.kind === "file" && source.subtitle
                    ? source.subtitle
                    : source.title;
                const cardClasses = [
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
                  "transition-colors",
                  colorScheme === "dark"
                    ? "bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800"
                    : "bg-slate-50 hover:bg-white border border-slate-200",
                ].join(" ");
                const visitClasses = [
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide cursor-pointer",
                  "bg-[#0689D8] text-white hover:bg-[#0579C0]",
                ].join(" ");
                return (
                  <div key={source.key} className={cardClasses}>
                    <div className="flex min-w-0 items-start gap-2">
                      <div
                        className={[
                          "mt-0.5 flex h-7 w-7 items-center justify-center rounded-md border",
                          colorScheme === "dark"
                            ? "border-slate-700 bg-slate-800 text-slate-200"
                            : "border-slate-200 bg-white text-slate-600",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        <CgFileDocument className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-md font-semibold ${colorScheme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                          {source.title}
                        </div>
                        <div className={`text-sm ${colorScheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                          {source.subtitle ?? source.kind.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openReferencePage(filename)}
                      className={visitClasses}
                    >
                      Visit
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type SettingsPanelProps = {
  colorScheme: "light" | "dark";
  radius: "pill" | "round" | "soft" | "sharp";
  density: "compact" | "normal" | "spacious";
  width: "360px" | "540px" | "720px";
  model: "gpt-5-mini" | "gpt-5" | "gpt-5-nano" | "gpt-4.1";
  verbosity: "low" | "medium" | "high";
  onColorSchemeChange: (value: "light" | "dark") => void;
  onRadiusChange: (value: "pill" | "round" | "soft" | "sharp") => void;
  onDensityChange: (value: "compact" | "normal" | "spacious") => void;
  onWidthChange: (value: "360px" | "540px" | "720px") => void;
  onModelChange: (value: "gpt-5-mini" | "gpt-5" | "gpt-5-nano" | "gpt-4.1") => void;
  onVerbosityChange: (value: "low" | "medium" | "high") => void;
};

function SettingsPanel({
  colorScheme,
  radius,
  density,
  width,
  model,
  verbosity,
  onColorSchemeChange,
  onRadiusChange,
  onDensityChange,
  onWidthChange,
  onModelChange,
  onVerbosityChange,
}: SettingsPanelProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-4 font-sans text-md">
      <label className="flex flex-col gap-1">
        <span className="text-gray-700">Color scheme</span>
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1"
          value={colorScheme}
          onChange={(e) => onColorSchemeChange(e.target.value as "light" | "dark")}
        >
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-700">Radius</span>
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1"
          value={radius}
          onChange={(e) => onRadiusChange(e.target.value as "pill" | "round" | "soft" | "sharp")}
        >
          <option value="pill">pill</option>
          <option value="round">round</option>
          <option value="soft">soft</option>
          <option value="sharp">sharp</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-700">Density</span>
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1"
          value={density}
          onChange={(e) => onDensityChange(e.target.value as "compact" | "normal" | "spacious")}
        >
          <option value="compact">compact</option>
          <option value="normal">normal</option>
          <option value="spacious">spacious</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-700">Chat width</span>
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1"
          value={width}
          onChange={(e) => onWidthChange(e.target.value as "360px" | "540px" | "720px")}
        >
          <option value="360px">360px</option>
          <option value="540px">540px</option>
          <option value="720px">720px</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-700">Model</span>
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1"
          value={model}
          onChange={(e) =>
            onModelChange(e.target.value as "gpt-5-mini" | "gpt-5" | "gpt-5-nano" | "gpt-4.1")
          }
        >
          <option value="gpt-5-mini">gpt-5-mini</option>
          <option value="gpt-5">gpt-5</option>
          <option value="gpt-5-nano">gpt-5-nano</option>
          <option value="gpt-4.1">gpt-4.1</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-700">Verbosity</span>
        <select
          className={`rounded border px-2 py-1 ${
            model === "gpt-4.1"
              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border-gray-300 bg-white"
          }`}
          value={verbosity}
          onChange={(e) => onVerbosityChange(e.target.value as "low" | "medium" | "high")}
          disabled={model === "gpt-4.1"}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </label>
    </div>
  );
}

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [radius, setRadius] = useState<"pill" | "round" | "soft" | "sharp">("round");
  const [density, setDensity] = useState<"compact" | "normal" | "spacious">("normal");
  const [chatWidth, setChatWidth] = useState<"360px" | "540px" | "720px">("360px");
  const [model, setModel] = useState<"gpt-5-mini" | "gpt-5" | "gpt-5-nano" | "gpt-4.1">("gpt-4.1");
  const [verbosity, setVerbosity] = useState<"low" | "medium" | "high">("low");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [referenceSources, setReferenceSources] = useState<ReferenceSource[]>([]);
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);

  const fetchLatestReferences = useCallback(async () => {
    if (!activeThreadId) {
      setReferenceSources([]);
      return;
    }
    setIsLoadingReferences(true);
    try {
      const response = await fetch(CHATKIT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "items.list",
          params: {
            thread_id: activeThreadId,
            limit: 50,
            order: "desc",
          },
        }),
      });

      const payload = await response.json();
      const items = Array.isArray(payload?.data) ? payload.data : [];
      const latestAssistant = items.find(
        (item: any) =>
          item?.type === "assistant_message" &&
          Array.isArray(item?.content) &&
          item.content.some((part: any) => Array.isArray(part?.annotations) && part.annotations.length > 0)
      );

      if (!latestAssistant) {
        setReferenceSources([]);
        return;
      }

      const rawSources = (latestAssistant.content ?? [])
        .flatMap((part: any) => part?.annotations ?? [])
        .map((annotation: any) => annotation?.source)
        .filter(Boolean);

      const unique = new Map<string, ReferenceSource>();
      for (const source of rawSources) {
        const kind = source?.type ?? "unknown";
        const title = source?.title ?? "Untitled reference";
        const subtitle =
          kind === "url"
            ? source?.url
            : kind === "file"
              ? source?.filename ?? source?.description
              : kind === "entity"
                ? source?.label ?? source?.id
                : source?.description;
        const key = `${kind}|${title}|${subtitle ?? ""}`;
        if (!unique.has(key)) {
          unique.set(key, { key, title, subtitle, kind });
        }
      }

      console.log('references: ', Array.from(unique.values()))
      setReferenceSources(Array.from(unique.values()));
    } catch (error) {
      console.error("Failed to load references", error);
      setReferenceSources([]);
    } finally {
      setIsLoadingReferences(false);
    }
  }, [activeThreadId]);
  const chatkit = useChatKit({
    api: {
      url: CHATKIT_API_URL,
      domainKey: CHATKIT_API_DOMAIN_KEY,
      fetch: (url, options) => {
        const headers = new Headers(options?.headers ?? {});
        headers.set("X-ChatKit-Model", model);
        headers.set("X-ChatKit-Verbosity", verbosity);
        return fetch(url, { ...options, headers });
      },
    },
    initialThread: activeThreadId,
    theme: {
      color: {
        accent: {
          primary: '#0689D8',
          level: 1
        }
      },
      colorScheme, // Alternatives: "light", "dark"
      radius,   // Alternatives: "pill", "round", "soft", "sharp"
      density // Alternatives: "compact", "normal", "spacious"
    },
    onThreadChange: (e) => setActiveThreadId(e.threadId),
    onResponseEnd: () => {
      void fetchLatestReferences();
    },
    onReady: () => console.log("ChatKit ready"),
    onError: (e) => console.error("ChatKit error:", e.error),
    onLog: (e) => console.log("ChatKit log:", e.name, e.data),
    onEffect: (e) => console.log("ChatKit effect:", e.name, e.data),
    startScreen: {
      greeting: "Welcome to Samsung Support. How can I help you today?",
    //   prompts: [
    //   {
    //     icon: 'circle-question',
    //     label: 'What is Yext Search?',
    //     prompt: 'What is Yext Search?'
    //   },
    //   {
    //     icon: 'circle-question',
    //     label: 'Help me with a Search Frontend',
    //     prompt: 'How can I set up a new Search Frontend?'
    //   },
    //   {
    //     icon: 'circle-question',
    //     label: 'What are custom phrases?',
    //     prompt: 'What are custom phrases in Yext Search?'
    //   },
    // ],
    prompts: [
      {
        icon: 'circle-question',
        label: 'How can I contact support?',
        prompt: 'How can I contact support?'
      },
      {
        icon: 'circle-question',
        label: 'Good phones for gaming',
        prompt: 'What are good phones for gaming?'
      },
      {
        icon: 'circle-question',
        label: 'What is airplane mode?',
        prompt: 'What is airplane mode?'
      },
    ],
    },
    composer: {
      placeholder: "Type your message...",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, [chatkit]);

  useEffect(() => {
    void fetchLatestReferences();
  }, [fetchLatestReferences]);

  const chatWidthClass =
    chatWidth === "720px"
      ? "w-[720px]"
      : chatWidth === "540px"
        ? "w-[540px]"
        : "w-[360px]";

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen font-sans">
        Loading ChatKit...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen flex-col p-5 bg-gray-50 box-border">
      <div className="bg-gray-100 p-4 mb-5 rounded-lg font-mono text-sm border border-gray-300 overflow-x-auto">
        <div className="font-bold mb-2">ChatKit Debug Info:</div>
        <div>API URL: <code className="bg-gray-200 px-1 rounded">{CHATKIT_API_URL}</code></div>
        <div>Domain Key: <code className="bg-gray-200 px-1 rounded">{CHATKIT_API_DOMAIN_KEY}</code></div>
        <div>Status: {chatkit ? '✅ Initialized' : '❌ Not Initialized'}</div>
      </div>
      
      <div className="flex-1 flex flex-col border-2 border-blue-500 rounded-lg overflow-hidden min-h-[500px] relative bg-white">
        <SettingsPanel
          colorScheme={colorScheme}
          radius={radius}
          density={density}
          width={chatWidth}
          model={model}
          verbosity={verbosity}
          onColorSchemeChange={setColorScheme}
          onRadiusChange={setRadius}
          onDensityChange={setDensity}
          onWidthChange={setChatWidth}
          onModelChange={setModel}
          onVerbosityChange={setVerbosity}
        />
        {chatkit?.control ? (
          <div className="flex-1">
            <div className="flex flex-col items-center gap-6 px-6 pb-6 md:min-h-full md:flex-row md:items-center md:justify-center">
              {chatkit.control && (
                <>
                  <ChatKit 
                    control={chatkit.control}
                    className={`h-[600px] ${chatWidthClass} shrink-0 shadow-xl rounded-3xl border-2 overflow-hidden`}
                  />
                  <div className="shrink-0">
                    <ReferencesWidgetPanel
                      colorScheme={colorScheme}
                      activeThreadId={activeThreadId}
                      isLoadingReferences={isLoadingReferences}
                      referenceSources={referenceSources}
                    />
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white px-2 py-1 rounded text-xs z-[1000]">
                    ChatKit Container
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 font-sans">
            Initializing ChatKit...
          </div>
        )}
      </div>
    </div>
  );
}
