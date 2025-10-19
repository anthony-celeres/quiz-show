'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Quiz, Question } from '@/types/quiz';
import { Plus, Trash2, Globe, Lock } from 'lucide-react';

interface ChallengerQuizFormProps {
  onSuccess: (quiz: Quiz) => void;
  onCancel: () => void;
  quizToEdit?: Quiz;
}

export const ChallengerQuizForm = ({ onSuccess, onCancel, quizToEdit }: ChallengerQuizFormProps) => {
  const [title, setTitle] = useState(quizToEdit?.title || '');
  const [description, setDescription] = useState(quizToEdit?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(quizToEdit?.duration_minutes || 15);
  const [visibility, setVisibility] = useState<'public' | 'private'>(quizToEdit?.visibility || 'public');
  const [maxAttempts, setMaxAttempts] = useState<number | null>(quizToEdit?.max_attempts ?? null);
  const [questions, setQuestions] = useState<Partial<Question>[]>(
    quizToEdit?.questions || [{ question_text: '', correct_answer: '', points: 1, type: 'identification', options: [] }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddQuestion = () => {
    setQuestions([...questions, { question_text: '', correct_answer: '', points: 1, type: 'identification', options: [] }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

      const quizPayload = {
        title,
        description,
        duration_minutes: durationMinutes,
        total_points: totalPoints,
        visibility,
        max_attempts: maxAttempts,
        is_active: true,
        activation_cycle: 0,
      };

      // If editing, update the quiz
      if (quizToEdit?.id) {
        const quizResponse = await fetch(`/api/quizzes/${quizToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizPayload),
        });

        const quizResult = await quizResponse.json();

        if (!quizResponse.ok) {
          throw new Error(quizResult.error || 'Failed to update quiz');
        }

        // For now, we'll just redirect. In a full implementation, you'd want to
        // handle updating/deleting/creating questions as well.
        onSuccess(quizResult.data);
        return;
      }

      // Otherwise, create new quiz
      const quizResponse = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizPayload),
      });

      const quizResult = await quizResponse.json();

      if (!quizResponse.ok) {
        throw new Error(quizResult.error || 'Failed to create quiz');
      }

      const createdQuiz = quizResult.data;

      // Create questions
      for (const question of questions) {
        if (!question.question_text) continue;

        const questionPayload = {
          quiz_id: createdQuiz.id,
          question_text: question.question_text,
          correct_answer: question.correct_answer,
          points: question.points || 1,
          type: question.type || 'identification',
          options: question.options || [],
        };

        const questionResponse = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionPayload),
        });

        if (!questionResponse.ok) {
          const questionError = await questionResponse.json();
          throw new Error(questionError.error || 'Failed to create question');
        }
      }

      onSuccess(createdQuiz);
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {quizToEdit ? 'Edit Quiz' : 'Create New Quiz'}
          </CardTitle>
          <CardDescription>
            Design your quiz and choose who can take it
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mathematics Quiz 1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the quiz"
                  className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/1000 characters
                </p>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDurationMinutes(val === '' ? 1 : parseInt(val));
                  }}
                  required
                />
              </div>

              <div>
                <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                <select
                  id="maxAttempts"
                  value={maxAttempts === null ? 'unlimited' : maxAttempts.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMaxAttempts(val === 'unlimited' ? null : parseInt(val));
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="1">1 attempt (One-time only)</option>
                  <option value="2">2 attempts</option>
                  <option value="3">3 attempts</option>
                  <option value="5">5 attempts</option>
                  <option value="10">10 attempts</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Controls how many times a user can take this quiz. Choose &quot;Unlimited&quot; for practice quizzes.
                </p>
              </div>

              {/* Visibility Selection */}
              <div>
                <Label>Quiz Visibility *</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      visibility === 'public'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Public</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">
                      Anyone can find and take this quiz
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      visibility === 'private'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Private</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">
                      Only you can take this quiz
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="border-t pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Questions</h3>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {index + 1}
                      </span>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Question Text *</Label>
                        <Input
                          value={question.question_text || ''}
                          onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                          placeholder="Enter your question"
                          required
                        />
                      </div>

                      <div>
                        <Label>Question Type *</Label>
                        <select
                          value={question.type || 'identification'}
                          onChange={(e) => {
                            const newType = e.target.value as 'multiple' | 'identification' | 'truefalse';
                            const updated = [...questions];
                            
                            // Reset correct_answer and options based on type
                            if (newType === 'truefalse') {
                              updated[index] = {
                                ...updated[index],
                                type: newType,
                                correct_answer: true,
                                options: []
                              };
                            } else if (newType === 'multiple') {
                              updated[index] = {
                                ...updated[index],
                                type: newType,
                                correct_answer: 0,
                                options: ['Option 1', 'Option 2', 'Option 3', 'Option 4']
                              };
                            } else {
                              updated[index] = {
                                ...updated[index],
                                type: newType,
                                correct_answer: '',
                                options: []
                              };
                            }
                            
                            setQuestions(updated);
                          }}
                          className="w-full px-3 py-2 border border-border rounded-md"
                          required
                        >
                          <option value="identification">Text Answer (Identification)</option>
                          <option value="multiple">Multiple Choice</option>
                          <option value="truefalse">True/False</option>
                        </select>
                      </div>

                      {question.type === 'multiple' && (
                        <div>
                          <Label>Options *</Label>
                          <div className="space-y-2 mt-2">
                            {(question.options || []).map((option, optIndex) => (
                              <div key={optIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(question.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    handleQuestionChange(index, 'options', newOptions);
                                  }}
                                  placeholder={`Option ${optIndex + 1}`}
                                  required
                                />
                                {(question.options?.length || 0) > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions = (question.options || []).filter((_, i) => i !== optIndex);
                                      handleQuestionChange(index, 'options', newOptions);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                                handleQuestionChange(index, 'options', newOptions);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}

                      {question.type === 'multiple' && (
                        <div>
                          <Label>Correct Answer (Option Number) *</Label>
                          <select
                            value={question.correct_answer as number || 0}
                            onChange={(e) => handleQuestionChange(index, 'correct_answer', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-border rounded-md"
                            required
                          >
                            {(question.options || []).map((opt, optIndex) => (
                              <option key={optIndex} value={optIndex}>
                                Option {optIndex + 1}: {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {question.type === 'truefalse' && (
                        <div>
                          <Label>Correct Answer *</Label>
                          <select
                            value={String(question.correct_answer)}
                            onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value === 'true')}
                            className="w-full px-3 py-2 border border-border rounded-md"
                            required
                          >
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        </div>
                      )}

                      {question.type === 'identification' && (
                        <div>
                          <Label>Correct Answer *</Label>
                          <Input
                            value={question.correct_answer as string || ''}
                            onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                            placeholder="Enter the correct answer"
                            required
                          />
                        </div>
                      )}

                      <div>
                        <Label>Points *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={question.points || 1}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleQuestionChange(index, 'points', val === '' ? 1 : parseInt(val));
                          }}
                          required
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Add Question Button at Bottom */}
              <div className="mt-4">
                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" size="lg" loading={loading} disabled={loading}>
                {quizToEdit ? 'Update Quiz' : 'Create Quiz'}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
