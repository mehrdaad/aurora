import React from "react";
import { NoteView, NoteModel } from "../aurora-note";
import FeedEditor from "./FeedEditor.js";
import search from "../aurora-search";
import styled from "styled-components";
import { EditorState } from "draft-js";
import PropTypes from "prop-types";
import _ from "lodash";
import Animate, { FadeInUp } from "animate-css-styled-components";

/**
 * Adds a "text" version of the editor state to each note in the notes object
 */
const fromNotesToSearchableObjects = notes => {
  const ids = Object.keys(notes);
  return ids.map(id => {
    return {
      text: notes[id].editorState.getCurrentContent().getPlainText(),
      id: id
    };
  });
};

/* Maps a list of valid ids to a dictionary of notes, selecting only a subset of all notes. */
const mapIdsToNotes = (ids, allNotes) => {
  const notes = {};
  ids.forEach(id => {
    notes[id] = allNotes[id];
  });
  return notes;
};

/**
 * Creates data that we can use for a Note
 * @param {EditorState} editorState
 */
const addNewNoteData = (notes, note) => {
  notes[note.id] = note;
  return notes;
};

const removeNoteData = (notes, id) => {
  delete notes[id];
  return notes;
};

const FlexSeperated = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
`;

const NoteWrapper = styled.div`
  width: 100%;
  padding-bottom: 50px;
`;

class Feed extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shownNotes: {}, // The notes that the user sees
      allNotes: {}, // A local copy of all the notes
      inputEditorState: EditorState.createEmpty(),
      inputEditorFocused: true
    };

    this.props.persist.loadNotes(this.addSavedNotes);
  }

  addSavedNotes = notes => {
    notes.forEach(note => {
      this.addCard(note);
    });
  };

  // Note: This fat arrow function syntax let's us not have to `bind(this);` in the
  // constructor. See: https://facebook.github.io/react/docs/handling-events.html
  addCard = note => {
    // Don't allow a note that isn't a NoteModel
    if (!(note instanceof NoteModel)) {
      throw new Error(
        "Feed called addCard on something that isn't a NoteModel"
      );
    }

    // Don't add a note if it doesn't exist. AUR-20
    const text = note.editorState.getCurrentContent().getPlainText();
    if (!text || _.trim(text).length === 0) {
      return;
    }

    this.setState(prevState => {
      prevState.shownNotes = addNewNoteData(prevState.shownNotes, note);
      prevState.allNotes = addNewNoteData(prevState.allNotes, note);
      return prevState;
    });
  };

  onChange = editorState => {
    this.setState({
      inputEditorState: editorState
    });
    // Only search once every XYZ miliseconds so we're not flashing
    const searchOnlyAfterABit = _.debounce(this.searchCard, 250);
    searchOnlyAfterABit(editorState);
  };

  searchCard = editorState => {
    this.setState(prevState => {
      const ids = search(
        fromNotesToSearchableObjects(prevState.allNotes),
        editorState.getCurrentContent().getPlainText()
      );

      const notes = mapIdsToNotes(ids, prevState.allNotes);

      if (ids.length === 0) {
        prevState.shownNotes = Object.assign({}, prevState.allNotes); // makes a copy
        return prevState;
      }
      prevState.shownNotes = Object.assign({}, notes); // makes a copy of notes
      return prevState;
    });
  };

  onDelete = id => {
    this.props.persist.deleteNote(id);
    this.setState(prevState => {
      prevState.shownNotes = removeNoteData(prevState.shownNotes, id);
      prevState.allNotes = removeNoteData(prevState.allNotes, id);
      return prevState;
    });
  };

  onUpdate = (id, editorState) => {
    this.setState(prevState => {
      prevState.shownNotes[id].setEditorState(editorState);
      prevState.allNotes[id].setEditorState(editorState);
      return prevState;
    });
  };

  onNoteFocusEnded = id => {
    const note = this.state.allNotes[id];
    this.props.persist.save(note);
  };

  onSubmit = editorState => {
    const note = new NoteModel(editorState);

    this.addCard(note);
    this.props.persist.save(note);

    // Clear the main editor's state
    this.setState({
      inputEditorState: EditorState.createEmpty()
    });
  };

  render() {
    // Create a note for each id
    const ids = Object.keys(this.state.shownNotes);
    const notes = ids.map(id => {
      return (
        <Animate key={id} Animation={[FadeInUp]} duration={"0.2s"}>
          <NoteView
            id={id}
            key={id}
            defaultEditorState={this.state.shownNotes[id].editorState}
            onDelete={this.onDelete}
            onUpdate={this.onUpdate}
            onFocusEnded={this.onNoteFocusEnded}
          />
        </Animate>
      );
    });

    return (
      <FlexSeperated className="flex-seperated">
        <NoteWrapper className="note-wrapper">{notes}</NoteWrapper>
        <FeedEditor
          className="card-at-bottom-editor"
          onSubmit={this.onSubmit}
          onChange={this.onChange}
          editorState={this.state.inputEditorState}
          focused={this.state.inputEditorFocused}
        />
      </FlexSeperated>
    );
  }
}

Feed.propTypes = {
  persist: PropTypes.shape({
    save: PropTypes.func.isRequired,
    deleteNote: PropTypes.func.isRequired,
    loadNotes: PropTypes.func.isRequired
  })
};

export default Feed;
