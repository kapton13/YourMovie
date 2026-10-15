import { notFound } from "next/navigation";

/** Будь-яка неіснуюча адреса з мовою → сторінка «Такої сторінки немає» потрібною мовою. */
export default function Missing() {
  notFound();
}
