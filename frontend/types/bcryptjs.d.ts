declare module "bcryptjs" {
  function hash(data: string, salt: string | number): Promise<string>;
  function compare(data: string, hash: string): Promise<boolean>;
  function genSalt(rounds?: number): Promise<string>;
  export default { hash, compare, genSalt };
}
