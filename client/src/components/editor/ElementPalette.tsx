import { useDrag } from "react-dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  Square, 
  FormInput, 
  Heading1, 
  Heading2, 
  Heading3,
  Image, 
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEditorStore } from "@/lib/editor-store";
import { useEffect, useState } from "react";

const elementTypes = [
  { id: "p", icon: Type, label: "Paragraphs" },
  { id: "h1", icon: Heading1, label: "Heading 1" },
  { id: "h2", icon: Heading2, label: "Heading 2" },
  { id: "h3", icon: Heading3, label: "Heading 3" },
  { id: "button", icon: Square, label: "Buttons" },
  { id: "img", icon: Image, label: "Images" },
];

function DraggableElement({ type, icon: Icon, label }: { type: string; icon: any; label: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Button
        variant="outline"
        className="flex items-center gap-2 w-full justify-start"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </div>
  );
}

function ElementsList({ type }: { type: string }) {
  const { html, setHtml, setSelectedElement } = useEditorStore();
  const [elements, setElements] = useState<HTMLElement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const foundElements = Array.from(doc.getElementsByTagName(type));
    foundElements.forEach((el, index) => {
      if (!el.getAttribute('data-element-id')) {
        el.setAttribute('data-element-id', `${type}-${index}`);
      }
    });
    setElements(foundElements as HTMLElement[]);
  }, [html, type]);

  const updatePreview = (elementId: string, element: HTMLElement) => {
    const previewFrame = document.querySelector('iframe');
    if (previewFrame?.contentDocument) {
      previewFrame.contentDocument.querySelectorAll('.element-highlight').forEach(el => {
        el.classList.remove('element-highlight');
      });

      const elementInPreview = previewFrame.contentDocument.querySelector(
        `[data-element-id="${elementId}"]`
      ) as HTMLElement;

      if (elementInPreview) {
        elementInPreview.classList.add('element-highlight');
        elementInPreview.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setSelectedElement(elementInPreview);
      }
    }
  };

  const handleElementClick = (element: HTMLElement) => {
    const elementId = element.getAttribute('data-element-id');
    if (!elementId) return;

    setEditingId(elementId);
    setEditingText(element.textContent || '');
    updatePreview(elementId, element);
  };

  const handleTextEdit = (element: HTMLElement, newText: string) => {
    const elementId = element.getAttribute('data-element-id');
    if (!elementId) return;

    setEditingText(newText);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elementToUpdate = doc.querySelector(`[data-element-id="${elementId}"]`);
    
    if (elementToUpdate) {
      // Handle different element types
      if (type === 'img') {
        (elementToUpdate as HTMLImageElement).alt = newText;
      } else if (type === 'button') {
        elementToUpdate.innerHTML = newText;
      } else {
        elementToUpdate.textContent = newText;
      }

      // Preserve all attributes and styles
      Array.from(element.attributes).forEach(attr => {
        if (attr.name !== 'contenteditable') {
          elementToUpdate.setAttribute(attr.name, attr.value);
        }
      });

      // Immediately update the editor store
      const updatedHtml = doc.documentElement.outerHTML;
      setHtml(updatedHtml);

      // Update local state
      setElements(prev => 
        prev.map(el => 
          el.getAttribute('data-element-id') === elementId 
            ? elementToUpdate as HTMLElement 
            : el
        )
      );

      // Update preview in real-time
      const previewFrame = document.querySelector('iframe');
      if (previewFrame?.contentDocument) {
        const elementInPreview = previewFrame.contentDocument.querySelector(
          `[data-element-id="${elementId}"]`
        ) as HTMLElement;

        if (elementInPreview) {
          if (type === 'img') {
            (elementInPreview as HTMLImageElement).alt = newText;
          } else if (type === 'button') {
            elementInPreview.innerHTML = newText;
          } else {
            elementInPreview.textContent = newText;
          }
          
          elementInPreview.classList.add('element-highlight');
          elementInPreview.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          setSelectedElement(elementInPreview);
        }
      }
    }
  };

  return (
    <div className="space-y-2 pl-4">
      {elements.map((element) => {
        const elementId = element.getAttribute('data-element-id');
        const isEditing = elementId === editingId;
        const elementText = type === 'img' ? element.getAttribute('alt') || '' : element.textContent || '';
        
        return (
          <div key={elementId} className="flex flex-col gap-2">
            <div
              className={`p-2 rounded hover:bg-accent group relative ${
                isEditing ? 'bg-accent' : ''
              }`}
              onMouseEnter={() => {
                const previewFrame = document.querySelector('iframe');
                if (previewFrame?.contentDocument) {
                  const elementInPreview = previewFrame.contentDocument.querySelector(
                    `[data-element-id="${elementId}"]`
                  ) as HTMLElement;
                  if (elementInPreview) {
                    elementInPreview.classList.add('element-hover');
                    elementInPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
              onMouseLeave={() => {
                const previewFrame = document.querySelector('iframe');
                if (previewFrame?.contentDocument) {
                  const elementInPreview = previewFrame.contentDocument.querySelector(
                    `[data-element-id="${elementId}"]`
                  ) as HTMLElement;
                  if (elementInPreview) {
                    elementInPreview.classList.remove('element-hover');
                  }
                }
              }}
              onClick={() => handleElementClick(element)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-muted-foreground font-mono">
                  {type.toUpperCase()}:
                </span>
                <input
                  type="text"
                  value={isEditing ? editingText : elementText}
                  onChange={(e) => handleTextEdit(element, e.target.value)}
                  onFocus={() => handleElementClick(element)}
                  onBlur={() => {
                    setEditingId(null);
                    // Ensure the final text is applied
                    handleTextEdit(element, editingText);
                  }}
                  className={`w-full bg-transparent border-none focus:ring-2 focus:ring-primary rounded px-2 py-1 text-sm cursor-text ${
                    isEditing ? 'ring-2 ring-primary' : ''
                  }`}
                  placeholder={`Enter ${type} content...`}
                />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                Click to edit
              </div>
            </div>
          </div>
        );
      })}
      {elements.length === 0 && (
        <p className="text-sm text-muted-foreground pl-2">No {type} elements found</p>
      )}
    </div>
  );
}

export function ElementPalette() {
  return (
    <Card className="h-full p-4 overflow-auto">
      <div className="space-y-4">
        <h3 className="font-medium mb-4">Page Elements</h3>
        <Accordion type="single" collapsible className="w-full">
          {elementTypes.map((element) => (
            <AccordionItem key={element.id} value={element.id}>
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <element.icon className="h-4 w-4" />
                  {element.label}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ElementsList type={element.id} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Card>
  );
}
