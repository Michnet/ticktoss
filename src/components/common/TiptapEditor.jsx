'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Link2, Unlink, Undo2, Redo2 } from 'lucide-react';

function toolbarButtonStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: '1px solid var(--tt-border)',
    borderRadius: '6px',
    background: isActive ? 'var(--tt-flame)' : 'transparent',
    color: isActive ? '#fff' : 'var(--tt-text)',
    cursor: 'pointer',
  };
}

function MenuBar({ editor }) {
  if (!editor) return null;

  const divider = <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--tt-border)', margin: '0 0.25rem' }} />;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', padding: '0.5rem', background: 'var(--tt-surface-2)', borderBottom: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm) var(--tt-radius-sm) 0 0' }}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={toolbarButtonStyle(editor.isActive('bold'))}>
        <Bold size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={toolbarButtonStyle(editor.isActive('italic'))}>
        <Italic size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={toolbarButtonStyle(editor.isActive('underline'))}>
        <UnderlineIcon size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={toolbarButtonStyle(editor.isActive('strike'))}>
        <Strikethrough size={14} />
      </button>

      {divider}

      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={{ ...toolbarButtonStyle(editor.isActive('heading', { level: 1 })), width: 'auto', padding: '0 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
        H1
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={{ ...toolbarButtonStyle(editor.isActive('heading', { level: 2 })), width: 'auto', padding: '0 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={{ ...toolbarButtonStyle(editor.isActive('heading', { level: 3 })), width: 'auto', padding: '0 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
        H3
      </button>

      {divider}

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={toolbarButtonStyle(editor.isActive('bulletList'))}>
        <List size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={toolbarButtonStyle(editor.isActive('orderedList'))}>
        <ListOrdered size={14} />
      </button>

      {divider}

      <button
        type="button"
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          } else if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
          }
        }}
        style={toolbarButtonStyle(editor.isActive('link'))}
      >
        <Link2 size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} style={toolbarButtonStyle(false)}>
        <Unlink size={14} />
      </button>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} style={toolbarButtonStyle(false)}>
          <Undo2 size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} style={toolbarButtonStyle(false)}>
          <Redo2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function TiptapEditor({ value, onChange, placeholder = 'Start typing...', style = {} }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { style: 'color: var(--tt-flame);' } }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tt-tiptap-content',
        style: `min-height: ${style.height || '150px'}; outline: none; padding: 1rem; color: var(--tt-text);`,
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div style={{ border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', marginBottom: style.marginBottom, overflow: 'hidden', background: 'var(--tt-surface)' }}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tt-tiptap-content p.is-editor-empty:first-child::before {
          color: var(--tt-muted);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tt-tiptap-content:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
