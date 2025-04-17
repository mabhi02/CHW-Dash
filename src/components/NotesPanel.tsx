import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Grid,
  Col,
  Flex,
  Divider,
  Badge,
} from '@tremor/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import PdfUploader from './PdfUploader';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  // Load notes from local storage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('dashboard_notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Error parsing saved notes:', e);
      }
    }
  }, []);

  // Save notes to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard_notes', JSON.stringify(notes));
  }, [notes]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add a new note
  const addNote = () => {
    if (!newNoteTitle.trim()) {
      setSavedMessage('Please enter a title for your note.');
      setTimeout(() => setSavedMessage(''), 3000);
      return;
    }

    const now = new Date().toISOString();
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: now,
      updatedAt: now,
    };

    setNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    
    setSavedMessage('Note saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  // Start editing a note
  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingNoteId(null);
  };

  // Save edited note
  const saveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setSavedMessage('Please enter a title for your note.');
      setTimeout(() => setSavedMessage(''), 3000);
      return;
    }

    const updatedNotes = notes.map(note => 
      note.id === id 
        ? {
            ...note, 
            title: editTitle, 
            content: editContent,
            updatedAt: new Date().toISOString()
          } 
        : note
    );
    
    setNotes(updatedNotes);
    setEditingNoteId(null);
    
    setSavedMessage('Note updated successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  // Delete a note
  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    
    setSavedMessage('Note deleted successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="mt-6 space-y-6">
      <Grid numItems={1} numItemsMd={2} className="gap-6">
        <Col>
          {/* Create new note */}
          <Card className="bg-gray-900 border border-gray-700">
            <Title className="text-white">Add New Note</Title>
            <TextInput
              className="mt-4 bg-gray-800 text-white border-gray-700"
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
            <Textarea
              className="mt-2 bg-gray-800 text-white border-gray-700"
              placeholder="Note Content"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={5}
            />
            <Flex className="mt-4 justify-end">
              <Button
                icon={PlusIcon} 
                onClick={addNote}
                className="bg-blue-700 hover:bg-blue-600 text-white"
              >
                Save Note
              </Button>
            </Flex>
            {savedMessage && (
              <Text className="mt-2 text-green-500">{savedMessage}</Text>
            )}
          </Card>
        </Col>
        
        <Col>
          <PdfUploader />
        </Col>
      </Grid>

      {/* Notes list */}
      {notes.length > 0 ? (
        <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
          {notes.map(note => (
            <Col key={note.id}>
              <Card className="bg-gray-900 border border-gray-700">
                {editingNoteId === note.id ? (
                  <>
                    <TextInput
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mb-2 bg-gray-800 text-white border-gray-700"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                      className="mb-2 bg-gray-800 text-white border-gray-700"
                    />
                    <Flex className="justify-end gap-2 mt-4">
                      <Button 
                        icon={XMarkIcon} 
                        variant="secondary" 
                        color="red" 
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                      <Button 
                        icon={CheckIcon} 
                        onClick={() => saveEdit(note.id)}
                        className="bg-blue-700 hover:bg-blue-600 text-white"
                      >
                        Save
                      </Button>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Flex justifyContent="between" alignItems="start">
                      <Title className="text-white">{note.title}</Title>
                      <Flex className="gap-1">
                        <Button 
                          icon={PencilIcon} 
                          variant="light" 
                          color="blue"
                          tooltip="Edit"
                          onClick={() => startEditing(note)}
                        />
                        <Button 
                          icon={TrashIcon} 
                          variant="light" 
                          color="red"
                          tooltip="Delete"
                          onClick={() => deleteNote(note.id)}
                        />
                      </Flex>
                    </Flex>
                    <Text className="mt-2 whitespace-pre-wrap text-white">{note.content}</Text>
                    <Divider />
                    <Flex className="mt-2 justify-between items-center">
                      <Text className="text-xs text-gray-300">
                        Created: {formatDate(note.createdAt)}
                      </Text>
                      {note.updatedAt !== note.createdAt && (
                        <Text className="text-xs text-gray-300">
                          Updated: {formatDate(note.updatedAt)}
                        </Text>
                      )}
                    </Flex>
                  </>
                )}
              </Card>
            </Col>
          ))}
        </Grid>
      ) : (
        <Card className="bg-gray-900 border border-gray-700">
          <Text className="text-center text-white">
            No notes yet. Create your first note above.
          </Text>
        </Card>
      )}
    </div>
  );
}