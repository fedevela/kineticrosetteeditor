type InvariantOptions = {
  context?: unknown;
  recoverable?: boolean;
};

const isLocalDev =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const serializeContext = (context: unknown): string => {
  if (context == null) return "";
  if (context instanceof Error) {
    return JSON.stringify({
      name: context.name,
      message: context.message,
      stack: context.stack,
    });
  }

  try {
    return JSON.stringify(context);
  } catch {
    return String(context);
  }
};

const formatMessage = (message: string, context?: unknown) => {
  const serializedContext = serializeContext(context);
  return serializedContext.length === 0 ? message : `${message} :: ${serializedContext}`;
};

export const invariant: (
  condition: unknown,
  message: string,
  options?: InvariantOptions,
) => asserts condition = (
  condition,
  message,
  options = {},
) => {
  if (condition) return;

  const payload = formatMessage(message, options.context);

  if (isLocalDev && !options.recoverable) {
    throw new Error(payload);
  }

  console.error(payload);
};
