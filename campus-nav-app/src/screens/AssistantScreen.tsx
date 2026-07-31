import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { campus } from '../data/campus';
import { answerQuery } from '../lib/assistant';
import { Room, Route } from '../types';

type ChatMessage = {
  id: string;
  from: 'user' | 'assistant';
  text: string;
  room?: Room | null;
  route?: Route | null;
};

type Props = {
  onShowRoute: (route: Route, room: Room) => void;
};

const WELCOME: ChatMessage = {
  id: 'welcome',
  from: 'assistant',
  text:
    "Hi! Ask me how to get anywhere in Block A — for example \"how do I get to the registrar's office?\" or \"where is room 203?\"",
};

export function AssistantScreen({ onShowRoute }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-u`, from: 'user', text };
    const answer = answerQuery(campus, text);
    const assistantMessage: ChatMessage = {
      id: `${Date.now()}-a`,
      from: 'assistant',
      text: answer.text,
      room: answer.room,
      route: answer.route,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={item.from === 'user' ? styles.userText : styles.assistantText}>{item.text}</Text>
            {item.route && item.room && (
              <TouchableOpacity style={styles.mapButton} onPress={() => onShowRoute(item.route!, item.room!)}>
                <Text style={styles.mapButtonText}>Show route on map</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask how to get somewhere..."
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={send}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  userBubble: { backgroundColor: '#4f7cff', alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: '#eef1f8', alignSelf: 'flex-start' },
  userText: { color: '#fff', fontSize: 15 },
  assistantText: { color: '#233', fontSize: 15 },
  mapButton: {
    marginTop: 8,
    backgroundColor: '#233',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  mapButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef1f8',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d6dceb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4f7cff',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: { color: '#fff', fontWeight: '700' },
});
