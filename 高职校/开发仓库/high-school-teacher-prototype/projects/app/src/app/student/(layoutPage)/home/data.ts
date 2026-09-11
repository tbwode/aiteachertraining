import type { HomePageData } from './types';

export async function getHomePageData(): Promise<HomePageData> {
  return {
    userName: '',
    greeting: '',
    weather: '',
    temperature: '',
    todoList: [],
    todoTotal: 0,
    newsList: [],
    abilityDimensions: [],
    suggestionList: []
  };
}
