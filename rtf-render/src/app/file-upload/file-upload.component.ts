import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RichTextObject } from '../models/rich-text-object';
import { typeEnum } from '../models/rich-text-object';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FileUploadComponent implements OnInit {

  public findForm: FormGroup;

  constructor(private sanitizer: DomSanitizer, private formBuilder: FormBuilder) {
    this.findForm = this.formBuilder.group({
      text: '',
      replace: '',
    })
   }

  public jsonContent: RichTextObject  = null;
  public renderData: SafeHtml;
  public rawString: string;
  public debugText: string;
  private fileReader: FileReader = new FileReader();
  public findIndex: number = 0;
  public totalFind: number = null;

  ngOnInit(): void {
    this.fileReader.onload = (event) => {
      this.debugText ='loaded file';
      this.jsonContent = JSON.parse(this.fileReader.result.toString());
      this.parseRichTextObject(this.jsonContent);
    }
  }

  async handleFileInput(files: FileList){
   
    this.fileReader.readAsText(files[0])
    
  }

  public nextFindResult(form){
    if(this.totalFind) {
      if ((this.findIndex+1) <= this.totalFind) {
        this.findIndex++;
        this.findObject(form, false);
      }
    }
    
  }
  public lastFindResult(form) {
    if(this.totalFind) {
      if ((this.findIndex-1) >= -1) {
        this.findIndex--;
        this.findObject(form, false);
      }
    }
  }

  public findObject(form, editing: boolean) {
    this.parseAndReplace(this.jsonContent, form.text, editing, null);
  }

  public replace(form) {
    if(!!form.replace && form.replace.length > 0) {
      this.parseAndReplace(this.jsonContent, form.text, true, form.replace);
    } else {
      this.parseAndReplace(this.jsonContent, form.text, false);
    }
    
  }

  public parseAndReplace(richTextObject: RichTextObject, findText: string,  editing: boolean, replace?: string) {
    let hightlightedInstance ='<span class="find highlight" id="highlighted">' + findText + "</span>"
    if((!!replace) && editing) {
      hightlightedInstance ='<span class="find highlight" id="highlighted">' + replace + "</span>"
    }
    let otherInstance = '<span class="find">' + findText + "</span>"
    let instanceCount = 0;
    if (richTextObject.type == typeEnum.doc) {
      this.debugText ='parsing doc';
      let newDisplayString = '';
      let paragraphCount = richTextObject.content.length;
      richTextObject.content.forEach((paragraph, paragraphIndex) => {
        this.debugText = 'parsing paragraph ' + paragraphIndex + '/'+paragraphCount;
        newDisplayString = newDisplayString.concat('<p>')
          paragraph.content.forEach((span, spanIndex) => {
            newDisplayString = newDisplayString.concat('<span')
            if (!!span.attrs) {
              newDisplayString = newDisplayString.concat(' style="')
              if(!!span.attrs.textCSS){
                if(!!span.attrs.textCSS.fontFamily){
                  newDisplayString = newDisplayString.concat('font-family:', span.attrs.textCSS.fontFamily, ';');
                }
                if(!!span.attrs.textCSS.fontStyle){
                  newDisplayString = newDisplayString.concat('font-style:', span.attrs.textCSS.fontStyle, ';');
                }
                if(!!span.attrs.textCSS.fontWeight){
                  newDisplayString = newDisplayString.concat('font-weight:', span.attrs.textCSS.fontWeight, ';');
                }
              }
              newDisplayString = newDisplayString.concat('"');
            }
            newDisplayString = newDisplayString.concat('>')
              span.content.forEach((text, textIndex) => {
                if (!!text.text) {
                let caseInsensitiveSubStrings = text.text.toLowerCase().split(findText.toLocaleLowerCase());
                let subStrings= [];
                let masterString = text.text;
                caseInsensitiveSubStrings.forEach((caseInsensitiveSubString) => {
                  subStrings.push(masterString.substring(0,caseInsensitiveSubString.length));
                  masterString = masterString.substring(caseInsensitiveSubString.length + findText.length);
                })
                text.content = []
                subStrings.forEach((subString, index) => {
                  newDisplayString = newDisplayString.concat(subString);
                  if ((index !== (subStrings.length-1))&& subStrings.length !== 1) {
                  if ((this.findIndex === instanceCount++)) {
                    newDisplayString = newDisplayString.concat(hightlightedInstance);
                    if(editing) {
                      this.jsonContent.content[paragraphIndex].content[spanIndex].content[textIndex].text = text.text.replace(findText, replace);
                      this.findIndex = this.findIndex -1;
                    }
                  } else {
                    newDisplayString = newDisplayString.concat(otherInstance);
                  } }
                })
              }
                
              })
            newDisplayString = newDisplayString.concat('</span>')
          })
          newDisplayString = newDisplayString.concat('</p>')
      })
      this.rawString = newDisplayString;
      this.renderData = this.sanitizer.bypassSecurityTrustHtml(newDisplayString);
      this.totalFind = this.rawString.split(findText).length -1;
      this.debugText = 'Found ' + (this.rawString.split(findText).length -1) + ' occurances of the text "' + findText + '"';
    }
    let element = document.getElementById('highlighted');
    if (!!element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
    
  }

  public find(form){
    this.debugText = 'Found ' + (this.rawString.split(form.text).length -1) + ' occurances of the text "' + form.text + '"';
    let highlightedString = this.rawString;
    const regex = new RegExp(form.text, 'g');
    let hightlightedInstance ='<span class="find highlight">' + form.text + "</span>"
    let otherInstance = '<span class="find">' + form.text + "</span>"
    let i = 0;
    highlightedString = highlightedString.replace(regex, function(match) {
      return match === form.text ? (i++ === 0 ? hightlightedInstance : otherInstance) : '';
    });
    this.renderData =  this.sanitizer.bypassSecurityTrustHtml(highlightedString);
  }



  parseRichTextObject(richTextObject: RichTextObject) {
    if (richTextObject.type == typeEnum.doc) {
      this.debugText ='parsing doc';
      let newDisplayString = '';
      let paragraphCount = richTextObject.content.length;
      richTextObject.content.forEach((paragraph, index) => {
        this.debugText = 'parsing paragraph ' + index + '/'+paragraphCount;
        newDisplayString = newDisplayString.concat('<p>')
          paragraph.content.forEach((span) => {
            newDisplayString = newDisplayString.concat('<span')
            if (!!span.attrs) {
              newDisplayString = newDisplayString.concat(' style="')
              if(!!span.attrs.textCSS){
                if(!!span.attrs.textCSS.fontFamily){
                  newDisplayString = newDisplayString.concat('font-family:', span.attrs.textCSS.fontFamily, ';');
                }
                if(!!span.attrs.textCSS.fontStyle){
                  newDisplayString = newDisplayString.concat('font-style:', span.attrs.textCSS.fontStyle, ';');
                }
                if(!!span.attrs.textCSS.fontWeight){
                  newDisplayString = newDisplayString.concat('font-weight:', span.attrs.textCSS.fontWeight, ';');
                }
              }
              newDisplayString = newDisplayString.concat('"');
            }
            newDisplayString = newDisplayString.concat('>')
              span.content.forEach((text) => {
                newDisplayString = newDisplayString.concat(text.text);
              })
            newDisplayString = newDisplayString.concat('</span>')
          })
          newDisplayString = newDisplayString.concat('</p>')
      })
      this.rawString = newDisplayString;
      this.renderData = this.sanitizer.bypassSecurityTrustHtml(newDisplayString);
      this.debugText = 'finished!';
    }
  }

}
