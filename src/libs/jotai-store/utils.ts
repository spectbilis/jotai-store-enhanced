export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function cloneDeep<T>(obj: T): T {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (obj instanceof Map) {
    const map = new Map();
    for (const [key, value] of obj.entries()) {
      map.set(cloneDeep(key), cloneDeep(value));
    }
    return map as unknown as T;
  }

  if (obj instanceof Set) {
    const set = new Set();
    for (const value of obj.values()) {
      set.add(cloneDeep(value));
    }
    return set as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cloneDeep(item)) as unknown as T;
  }

  const result: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = cloneDeep(obj[key]);
    }
  }

  return result as T;
}
