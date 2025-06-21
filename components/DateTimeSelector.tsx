import { Colors } from '@/constants/Colors';
import AgendamentoService from '@/services/AgendamentoService';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DateTimeSelectorProps {
  massagistaId: string;
  selectedDate: string;
  selectedTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

interface AvailableDate {
  dateString: string;
  day: number;
  dayName: string;
  monthName: string;
}

export default function DateTimeSelector({
  massagistaId,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: DateTimeSelectorProps) {
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const generateAvailableDates = useCallback(async () => {
    const dates: AvailableDate[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      // Verificar se tem horários disponíveis para esta data
      const horarios = await AgendamentoService.obterHorariosDisponiveis(
        massagistaId,
        dateString
      );

      if (horarios.length > 0) {
        dates.push({
          dateString,
          day: date.getDate(),
          dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
          monthName: date.toLocaleDateString('pt-BR', { month: 'short' }),
        });
      }
    }

    setAvailableDates(dates);
  }, [massagistaId]);

  const loadAvailableTimes = useCallback(async () => {
    const horarios = await AgendamentoService.obterHorariosDisponiveis(
      massagistaId,
      selectedDate
    );
    setAvailableTimes(horarios);
  }, [massagistaId, selectedDate]);

  useEffect(() => {
    if (massagistaId) {
      generateAvailableDates();
    }
  }, [massagistaId, generateAvailableDates]);

  useEffect(() => {
    if (selectedDate && massagistaId) {
      loadAvailableTimes();
    }
  }, [selectedDate, massagistaId, loadAvailableTimes]);

  const handleDateSelect = (dateString: string) => {
    onDateSelect(dateString);
    onTimeSelect(''); // Reset time selection
  };

  return (
    <View style={styles.container}>
      {/* Seleção de Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Escolha a Data</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.datesContainer}
        >
          {availableDates.map((date) => (
            <TouchableOpacity
              key={date.dateString}
              style={[
                styles.dateCard,
                selectedDate === date.dateString && styles.dateCardSelected,
              ]}
              onPress={() => handleDateSelect(date.dateString)}
            >
              <Text
                style={[
                  styles.dayName,
                  selectedDate === date.dateString && styles.dateTextSelected,
                ]}
              >
                {date.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  selectedDate === date.dateString && styles.dateTextSelected,
                ]}
              >
                {date.day}
              </Text>
              <Text
                style={[
                  styles.monthName,
                  selectedDate === date.dateString && styles.dateTextSelected,
                ]}
              >
                {date.monthName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Seleção de Horário */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escolha o Horário</Text>
          <View style={styles.timesContainer}>
            {availableTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeCard,
                  selectedTime === time && styles.timeCardSelected,
                ]}
                onPress={() => onTimeSelect(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
  },
  section: {
    padding: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  datesContainer: {
    flexDirection: 'row',
  },
  dateCard: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minWidth: 70,
  },
  dateCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayName: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  monthName: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  dateTextSelected: {
    color: Colors.textLight,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  timeCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  timeTextSelected: {
    color: Colors.textLight,
  },
});
