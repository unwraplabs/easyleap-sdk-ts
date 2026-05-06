import { clsx, type ClassValue } from "clsx";
import { num } from "starknet";
import { twMerge } from "tailwind-merge";
export * from "./constants";

export function standardise(address: string | bigint) {
  let _a = address;
  if (!address) {
    _a = "0";
  }
  const a = num.getHexString(num.getDecimalString(_a.toString()));
  return a;
}

// So that we can use normal classnames too
export function cn(...inputs: ClassValue[]) {
  const resolved = clsx(inputs);
  return twMerge(resolved, toPrefixedTailwindClasses(resolved));
}

function toPrefixedTailwindClasses(value: string) {
  if (!value) return "";

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => prefixTailwindToken(token))
    .join(" ");
}

function prefixTailwindToken(token: string) {
  if (!token || token.includes("easyleap-")) return token;
  if (token.startsWith("[") || token.startsWith("--")) return token;
  if (token.includes("(") || token.includes(")")) return token;

  const parts = token.split(":");
  const utility = parts[parts.length - 1];
  if (!utility) return token;

  const important = utility.startsWith("!");
  const baseUtility = important ? utility.slice(1) : utility;
  if (!baseUtility || baseUtility.startsWith("[")) return token;

  parts[parts.length - 1] = `${important ? "!" : ""}easyleap-${baseUtility}`;
  return parts.join(":");
}

export function shortAddress(
  _address: string | undefined,
  startChars = 4,
  endChars = 4
) {
  if (!_address) return "";
  const x = num.toHex(num.getDecimalString(_address));
  return truncate(x, startChars, endChars);
}

export function standariseAddress(address: string | bigint) {
  let _a = address;
  if (!address) {
    _a = "0";
  }
  const a = num.getHexString(num.getDecimalString(_a.toString()));
  return a;
}

export function truncate(str: string, startChars: number, endChars: number) {
  if (str.length <= startChars + endChars) {
    return str;
  }

  return `${str.slice(0, startChars)}...${str.slice(
    str.length - endChars,
    str.length
  )}`;
}

export * from "./constants";
