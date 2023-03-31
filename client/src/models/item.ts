export default interface Item {
  id: string;
  width: number;
  height: number;
  [key: string]: string | number;
}
