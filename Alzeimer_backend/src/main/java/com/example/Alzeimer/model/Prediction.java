package com.example.Alzeimer.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prediction")
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Input fields
    private int age;
    private int apoe4;
    private double accuracy;
    private int mistakes;
    private int maxMistakes;
    private double timeTaken;
    private int maxTime;
    private double learningScore;
    private int maxLearning;

    // Output fields
    private double mmse;
    private String zone;
    private String confidence;
    private String band;

    private LocalDateTime createdAt;

    // =========================
    // GETTERS & SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public int getApoe4() {
        return apoe4;
    }

    public void setApoe4(int apoe4) {
        this.apoe4 = apoe4;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public int getMistakes() {
        return mistakes;
    }

    public void setMistakes(int mistakes) {
        this.mistakes = mistakes;
    }

    public int getMaxMistakes() {
        return maxMistakes;
    }

    public void setMaxMistakes(int maxMistakes) {
        this.maxMistakes = maxMistakes;
    }

    public double getTimeTaken() {
        return timeTaken;
    }

    public void setTimeTaken(double timeTaken) {
        this.timeTaken = timeTaken;
    }

    public int getMaxTime() {
        return maxTime;
    }

    public void setMaxTime(int maxTime) {
        this.maxTime = maxTime;
    }

    public double getLearningScore() {
        return learningScore;
    }

    public void setLearningScore(double learningScore) {
        this.learningScore = learningScore;
    }

    public int getMaxLearning() {
        return maxLearning;
    }

    public void setMaxLearning(int maxLearning) {
        this.maxLearning = maxLearning;
    }

    public double getMmse() {
        return mmse;
    }

    public void setMmse(double mmse) {
        this.mmse = mmse;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public String getConfidence() {
        return confidence;
    }

    public void setConfidence(String confidence) {
        this.confidence = confidence;
    }

    public String getBand() {
        return band;
    }

    public void setBand(String band) {
        this.band = band;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}