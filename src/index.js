import App from "./app.svelte";

export const target = document.body;

export const app = new App({
  target,
  props: {}
});
