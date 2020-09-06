export enum typeEnum {
    doc = "doc",
    paragraph = "paragraph",
    span = "span",
    text = "text"
}
interface textCSSObject {
    fontFamily?: string,
    fontWeight?: string,
    fontStyle?: string,
}
interface blockCSSObject {
    textAlign?: string,
}
interface attrsObject {
    textCSS?: textCSSObject,
    bold?: boolean,
    italic?: boolean,
    font?: string,
    blockCSS?: blockCSSObject,
    alignment?: string,
}

export interface RichTextObject {
    type: typeEnum,
    content?: RichTextObject[],
    marks?: any[],
    text?: string,
    attrs?: attrsObject,
}